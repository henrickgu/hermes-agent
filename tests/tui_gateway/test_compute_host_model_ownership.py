"""Compute-host ownership must survive normal turns, but never a child crash."""

import threading
from types import SimpleNamespace

import pytest

from tui_gateway import server
from tui_gateway.host_supervisor import HostSupervisor


def _session(**extra):
    return {
        "agent": None,
        "agent_ready": threading.Event(),
        "history_lock": threading.Lock(),
        "history": [],
        "history_version": 0,
        "running": True,
        "attached_images": [],
        "_compute_host_active": True,
        **extra,
    }


@pytest.mark.parametrize("alive", [True, False])
def test_host_ownership_checks_the_live_supervisor_without_releasing_the_pin(monkeypatch, tmp_path, alive):
    session = _session(running=False, agent=object())
    supervisor = HostSupervisor(registry_path=tmp_path / "host.json",
                                expected_build_sha="test", autostart=False)
    supervisor._proc = SimpleNamespace(poll=lambda: None if alive else 1)
    assert supervisor.is_running() is alive
    monkeypatch.setattr(server, "_turn_isolation_enabled", lambda _cfg=None: True)
    monkeypatch.setattr(server, "_compute_host_supervisor", supervisor)

    assert server._session_uses_compute_host(session) is alive
    assert session["_compute_host_active"] is True


@pytest.mark.parametrize(
    "frame, expected_active",
    [
        ({"type": "turn.end"}, True),
        ({"type": "turn.error", "reason": "model_error"}, True),
        ({"type": "turn.error", "reason": "crash"}, False),
    ],
)
def test_only_a_child_crash_releases_host_ownership(monkeypatch, frame, expected_active):
    session = _session(pending_model_switch={"raw": "next-model"})
    monkeypatch.setattr(server, "_emit", lambda *_a, **_k: None)
    monkeypatch.setattr(server, "_compute_host_session_info", lambda _session: {})
    monkeypatch.setattr(server, "_drain_queued_prompt", lambda *_a, **_k: None)

    server._on_compute_host_turn_done("r1", "sid", session, frame)

    assert session["running"] is False
    assert bool(session.get("_compute_host_active")) is expected_active
    assert ("pending_model_switch" in session) is (frame["type"] == "turn.error")


def test_crash_during_dispatch_does_not_restore_dead_host_ownership(monkeypatch):
    session = _session(_compute_host_active=False)

    class FastCrashingSupervisor:
        def submit_turn(self, frame, *, on_complete):
            on_complete({"type": "turn.error", "reason": "crash"})

    monkeypatch.setattr(server, "_load_dashboard_process_isolation_config", lambda: {})
    monkeypatch.setattr(server, "_compute_host_turn_frame", lambda *_a, **_k: {})
    monkeypatch.setattr(server, "_get_compute_host_supervisor", lambda _cfg=None: FastCrashingSupervisor())
    monkeypatch.setattr(server, "_emit", lambda *_a, **_k: None)
    monkeypatch.setattr(server, "_compute_host_session_info", lambda _session: {})
    monkeypatch.setattr(server, "_drain_queued_prompt", lambda *_a, **_k: None)

    server._submit_prompt_to_compute_host("r1", "sid", session, "hello")

    assert session["running"] is False
    assert not session.get("_compute_host_active")


def test_failed_dispatch_does_not_claim_host_ownership(monkeypatch):
    session = _session(_compute_host_active=False)

    class BrokenSupervisor:
        def submit_turn(self, frame, *, on_complete):
            on_complete({"type": "turn.error", "reason": "send_failed"})
            raise BrokenPipeError("broken pipe")

    monkeypatch.setattr(server, "_load_dashboard_process_isolation_config", lambda: {})
    monkeypatch.setattr(server, "_compute_host_turn_frame", lambda *_a, **_k: {})
    monkeypatch.setattr(server, "_get_compute_host_supervisor", lambda _cfg=None: BrokenSupervisor())

    result = server._submit_prompt_to_compute_host("r1", "sid", session, "hello")

    assert result["error"]["code"] == 5019
    assert session["running"] is True  # The serving process still owns the fallback turn.
    assert not session.get("_compute_host_active")
    assert "_compute_host_turn_id" not in session
