"""A queued model switch must survive a serve restart (GLM→SOL incident).

``config.set model`` on a busy session stashes the pick in
``session["pending_model_switch"]`` — in-memory only before this fix. A
restart between the pick and the next turn dropped it silently: the
selector still showed the user's pick while the agent kept running on the
rehydrated old model.

Covers:
  - stashing persists a durable copy in state_meta
  - turn start rehydrates it onto a fresh session dict
  - applying the switch deletes the durable copy (consumed exactly once)
  - rehydration never clobbers a live pending pick or a newer override pin
"""

import json
import threading
import types

from tui_gateway import server


class _FakeDB:
    def __init__(self):
        self.meta = {}
        self.sessions = {}

    def set_meta(self, key, value):
        self.meta[key] = value

    def get_meta(self, key):
        return self.meta.get(key)

    def delete_meta(self, key):
        self.meta.pop(key, None)

    def delete_meta_if_value(self, key, expected):
        if self.meta.get(key) != expected:
            return False
        self.meta.pop(key, None)
        return True

    def get_session(self, session_id):
        return self.sessions.get(session_id)


def _session(**extra):
    return {
        "agent": types.SimpleNamespace(),
        "session_key": "agent:main:discord:dm:123",
        "history": [],
        "history_lock": threading.Lock(),
        "history_version": 0,
        "running": False,
        **extra,
    }


def _install_db(monkeypatch):
    db = _FakeDB()
    monkeypatch.setattr(server, "_get_db", lambda: db)
    return db


class TestPersistPendingSwitch:
    def test_persist_writes_durable_copy(self, monkeypatch):
        db = _install_db(monkeypatch)
        session = _session()
        pending = {
            "raw": "gpt-5.6-sol --provider openai-codex",
            "confirm_expensive_model": False,
            "display_model": "gpt-5.6-sol",
            "display_provider": "openai-codex",
        }
        server._persist_pending_model_switch(session, pending)

        key = server._pending_switch_meta_key(session["session_key"])
        assert key in db.meta
        stored = json.loads(db.meta[key])
        assert stored["raw"] == "gpt-5.6-sol --provider openai-codex"
        assert stored["display_model"] == "gpt-5.6-sol"

    def test_mirrored_stored_id_resolves_to_gateway_route_key(self, monkeypatch):
        db = _install_db(monkeypatch)
        db.sessions["stored-123"] = {
            "session_key": "agent:main:discord:dm:123"
        }
        session = _session(session_key="stored-123")

        server._persist_pending_model_switch(session, {"raw": "gpt-5.6-sol"})

        assert (
            server._pending_switch_meta_key("agent:main:discord:dm:123")
            in db.meta
        )
        assert server._pending_switch_meta_key("stored-123") not in db.meta

    def test_persist_without_session_key_is_noop(self, monkeypatch):
        db = _install_db(monkeypatch)
        server._persist_pending_model_switch({}, {"raw": "x"})
        assert db.meta == {}

    def test_gateway_intent_is_durable_non_secret_and_last_write_wins(self, monkeypatch):
        db = _install_db(monkeypatch)
        session = _session()
        server._persist_gateway_model_intent(
            session,
            {
                "model": "gpt-5.6-sol",
                "provider": "openai-codex",
                "base_url": "https://api.openai.com/v1",
                "api_key": "must-not-be-persisted",
            },
        )
        key = server._gateway_model_intent_meta_key(session["session_key"])
        first = json.loads(db.meta[key])
        assert first["model"] == "gpt-5.6-sol"
        assert "api_key" not in first

        server._persist_gateway_model_intent(
            session, {"model": "newer", "provider": "openai-codex"}
        )
        second = json.loads(db.meta[key])
        assert second["revision"] != first["revision"]
        assert second["model"] == "newer"

        server._clear_gateway_model_intent(session)
        assert key not in db.meta


class TestRehydratePendingSwitch:
    def test_rehydrate_restores_persisted_pick(self, monkeypatch):
        db = _install_db(monkeypatch)
        session = _session()
        server._persist_pending_model_switch(
            session,
            {
                "raw": "gpt-5.6-sol --provider openai-codex",
                "confirm_expensive_model": False,
                "display_model": "gpt-5.6-sol",
                "display_provider": "openai-codex",
            },
        )

        # Simulated restart: a fresh session dict for the same key.
        fresh = _session()
        server._rehydrate_pending_model_switch(fresh)

        pending = fresh.get("pending_model_switch")
        assert pending is not None
        assert pending["raw"] == "gpt-5.6-sol --provider openai-codex"
        assert pending["display_model"] == "gpt-5.6-sol"

    def test_rehydrate_keeps_live_pick(self, monkeypatch):
        db = _install_db(monkeypatch)
        session = _session()
        server._persist_pending_model_switch(session, {"raw": "old-model"})

        fresh = _session(pending_model_switch={"raw": "new-model"})
        server._rehydrate_pending_model_switch(fresh)

        assert fresh["pending_model_switch"]["raw"] == "new-model"

    def test_rehydrate_no_row_is_noop(self, monkeypatch):
        _install_db(monkeypatch)
        fresh = _session()
        server._rehydrate_pending_model_switch(fresh)
        assert "pending_model_switch" not in fresh

    def test_rehydrate_corrupt_row_is_noop(self, monkeypatch):
        db = _install_db(monkeypatch)
        key = server._pending_switch_meta_key("agent:main:discord:dm:123")
        db.meta[key] = "{not json"
        fresh = _session()
        server._rehydrate_pending_model_switch(fresh)
        assert "pending_model_switch" not in fresh


class TestApplyConsumesDurableCopy:
    def test_apply_deletes_persisted_row(self, monkeypatch):
        db = _install_db(monkeypatch)
        session = _session()
        pending = {
            "raw": "gpt-5.6-sol --provider openai-codex",
            "confirm_expensive_model": False,
            "display_model": "gpt-5.6-sol",
            "display_provider": "openai-codex",
        }
        server._persist_pending_model_switch(session, pending)
        session["pending_model_switch"] = pending

        applied = {}

        def _fake_apply(sid, sess, raw, *, confirm_expensive_model=False, **kw):
            applied["raw"] = raw
            # _apply_model_switch emits session.info before the durable intent
            # is deleted. That metadata path must not resurrect the same pick.
            server._rehydrate_pending_model_switch(sess)
            assert "pending_model_switch" not in sess
            return {"confirm_required": False}

        monkeypatch.setattr(server, "_apply_model_switch", _fake_apply)
        server._apply_pending_model_switch("sid", session)

        key = server._pending_switch_meta_key(session["session_key"])
        assert key not in db.meta, "applied switch must delete the durable copy"
        assert applied["raw"] == "gpt-5.6-sol --provider openai-codex"
        assert "pending_model_switch" not in session

    def test_newer_pick_arriving_during_apply_survives(self, monkeypatch):
        db = _install_db(monkeypatch)
        session = _session()
        first = {
            "revision": "a" * 32,
            "raw": "old-model",
            "display_model": "old-model",
        }
        second = {
            "revision": "b" * 32,
            "raw": "new-model",
            "display_model": "new-model",
        }
        server._persist_pending_model_switch(session, first)
        session["pending_model_switch"] = first

        def _fake_apply(*args, **kwargs):
            session["pending_model_switch"] = second
            server._persist_pending_model_switch(session, second)
            return {"confirm_required": False}

        monkeypatch.setattr(server, "_apply_model_switch", _fake_apply)
        server._apply_pending_model_switch("sid", session)

        assert session["pending_model_switch"] == second
        fresh = _session()
        server._rehydrate_pending_model_switch(fresh)
        assert fresh["pending_model_switch"]["raw"] == "new-model"

    def test_apply_failure_keeps_durable_row_for_retry(self, monkeypatch):
        db = _install_db(monkeypatch)
        session = _session()
        pending = {
            "raw": "gpt-5.6-sol --provider openai-codex",
            "confirm_expensive_model": False,
            "display_model": "gpt-5.6-sol",
            "display_provider": "openai-codex",
        }
        server._persist_pending_model_switch(session, pending)
        session["pending_model_switch"] = pending

        def _fail(*args, **kwargs):
            raise RuntimeError("temporary provider failure")

        monkeypatch.setattr(server, "_apply_model_switch", _fail)
        monkeypatch.setattr(server, "_emit", lambda *args, **kwargs: None)
        server._apply_pending_model_switch("sid", session)

        key = server._pending_switch_meta_key(session["session_key"])
        assert key in db.meta, "failed switch must remain durable for the next turn"

        # The next metadata heartbeat/resume can rehydrate it for retry.
        fresh = _session()
        server._rehydrate_pending_model_switch(fresh)
        assert fresh["pending_model_switch"]["display_model"] == "gpt-5.6-sol"
