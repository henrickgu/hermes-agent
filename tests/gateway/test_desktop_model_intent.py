"""Durable Desktop selector intent consumed by the messaging gateway."""

import json
import types

import gateway.run as gateway_run


class _DB:
    def __init__(self, payload):
        self.payload = payload
        self.pending_payload = None
        self.replace_on_delete = None
        self.deleted = []

    def get_meta(self, key):
        payload = self.payload if key.startswith("gateway_model_intent:") else self.pending_payload
        return json.dumps(payload) if payload is not None else None

    def delete_meta_if_value(self, key, expected):
        if key.startswith("gateway_model_intent:") and self.replace_on_delete:
            self.payload = self.replace_on_delete
            self.replace_on_delete = None
        current = self.get_meta(key)
        if current == expected:
            self.deleted.append(key)
            if key.startswith("gateway_model_intent:"):
                self.payload = None
            else:
                self.pending_payload = None
            return True
        return False


class _Store:
    def __init__(self):
        self.calls = []

    def set_model_override(self, session_key, override):
        self.calls.append((session_key, dict(override)))


def _runner():
    conversation = types.SimpleNamespace(model_override=None)
    state = types.SimpleNamespace(conversation=conversation)
    runner = types.SimpleNamespace(
        session_store=_Store(),
        _desktop_model_intent_revisions={},
        _session_state=lambda key: state,
        _evict_cached_agent=lambda key: None,
    )
    return runner, state


def _install(monkeypatch, db, *, base_url="https://api.openai.com/v1"):
    monkeypatch.setattr(
        gateway_run,
        "_resolve_runtime_agent_kwargs_for_provider",
        lambda provider: {
            "api_key": "synthetic-test-key",
            "base_url": base_url,
            "api_mode": "responses",
            "request_overrides": {},
            "capabilities": {},
        },
    )
    import hermes_state

    monkeypatch.setattr(hermes_state, "get_shared_session_db", lambda: db)


def test_applies_latest_intent_and_is_idempotent(monkeypatch):
    db = _DB(
        {
            "revision": "0000000000000000000000000000000a",
            "model": "gpt-5.6-sol",
            "provider": "openai-codex",
            "base_url": "https://api.openai.com/v1/responses",
        }
    )
    _install(monkeypatch, db)
    runner, state = _runner()

    gateway_run.GatewayRunner._apply_desktop_model_intent(
        runner, "agent:main:discord:dm:1"
    )
    assert state.conversation.model_override["model"] == "gpt-5.6-sol"
    assert state.conversation.model_override["api_key"] == "synthetic-test-key"
    assert len(runner.session_store.calls) == 1

    gateway_run.GatewayRunner._apply_desktop_model_intent(
        runner, "agent:main:discord:dm:1"
    )
    assert len(runner.session_store.calls) == 1, "same revision must be a no-op"


def test_newer_revision_wins(monkeypatch):
    db = _DB(
        {
            "revision": "00000000000000000000000000000001",
            "model": "old",
            "provider": "openai-codex",
        }
    )
    _install(monkeypatch, db)
    runner, state = _runner()
    key = "agent:main:discord:dm:1"

    gateway_run.GatewayRunner._apply_desktop_model_intent(runner, key)
    db.payload = {
        "revision": "00000000000000000000000000000002",
        "model": "new",
        "provider": "openai-codex",
    }
    gateway_run.GatewayRunner._apply_desktop_model_intent(runner, key)

    assert state.conversation.model_override["model"] == "new"
    assert [call[1]["model"] for call in runner.session_store.calls] == ["old", "new"]


def test_publish_during_consumption_is_not_deleted(monkeypatch):
    first = {
        "revision": "00000000000000000000000000000001",
        "model": "old",
        "provider": "openai-codex",
    }
    second = {
        "revision": "00000000000000000000000000000002",
        "model": "new",
        "provider": "openai-codex",
    }
    db = _DB(first)
    db.replace_on_delete = second
    _install(monkeypatch, db)
    runner, state = _runner()
    key = "agent:main:discord:dm:1"

    gateway_run.GatewayRunner._apply_desktop_model_intent(runner, key)
    assert db.payload == second, "conditional delete must preserve the newer write"

    gateway_run.GatewayRunner._apply_desktop_model_intent(runner, key)
    assert state.conversation.model_override["model"] == "new"
    assert [call[1]["model"] for call in runner.session_store.calls] == ["old", "new"]


def test_rejects_foreign_endpoint_before_pairing_credentials(monkeypatch):
    db = _DB(
        {
            "revision": "00000000000000000000000000000003",
            "model": "alias-model",
            "provider": "openai-codex",
            "base_url": "https://attacker.invalid/v1",
        }
    )
    _install(monkeypatch, db, base_url="https://api.openai.com/v1")
    runner, state = _runner()

    gateway_run.GatewayRunner._apply_desktop_model_intent(
        runner, "agent:main:discord:dm:1"
    )

    assert state.conversation.model_override is None
    assert runner.session_store.calls == []
    assert runner._desktop_model_intent_revisions == {}


def test_malformed_intent_is_ignored(monkeypatch):
    db = _DB({"revision": "nope", "model": "x", "provider": "y"})
    _install(monkeypatch, db)
    runner, state = _runner()
    gateway_run.GatewayRunner._apply_desktop_model_intent(runner, "key")
    assert state.conversation.model_override is None
