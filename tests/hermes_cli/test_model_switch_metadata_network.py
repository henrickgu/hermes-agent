"""A deferred switch's trailing catalog lookups must remain cache-only."""

import pytest

from hermes_cli import model_switch


@pytest.mark.parametrize("allow_network", [True, False])
def test_switch_threads_metadata_network_policy_to_both_lookups(monkeypatch, allow_network):
    calls = []

    def _capabilities(provider, model, *, allow_network):
        calls.append(("capabilities", provider, model, allow_network))
        return None

    def _info(provider, model, *, allow_network):
        calls.append(("info", provider, model, allow_network))
        return None

    # Routing/auth/endpoint validation have separate tests. Keep the public
    # switch and its result construction real to verify the metadata policy.
    for name in ("_route_from_model_input", "_resolve_switch_credentials", "_validate_switch"):
        monkeypatch.setattr(model_switch, name, lambda _state: None)
    monkeypatch.setattr(model_switch, "get_model_capabilities", _capabilities)
    monkeypatch.setattr(model_switch, "get_model_info", _info)
    monkeypatch.setattr("hermes_cli.runtime_provider._get_named_custom_provider", lambda _provider: None)

    result = model_switch.switch_model(
        "gpt-test",
        current_provider="openai",
        current_model="old-model",
        metadata_allow_network=allow_network,
    )

    assert result.success
    assert calls == [
        ("capabilities", "openai", "gpt-test", allow_network),
        ("info", "openai", "gpt-test", allow_network),
    ]
