"""Tests for supported_efforts_for — the picker's per-route effort view."""

import agent.reasoning_effort as re_mod


def test_glm53_family():
    assert re_mod.supported_efforts_for("zai", "glm-5.3") == ("low", "medium", "high", "max")
    assert re_mod.supported_efforts_for("zai", "glm-5.3-flash") == ("low", "medium", "high", "max")


def test_glm52_narrower():
    assert re_mod.supported_efforts_for("zai", "glm-5.2") == ("high", "max")


def test_codex_per_generation():
    # gpt-5.6: max exists; gpt-5.5: tops at xhigh. `none` never exposed.
    assert re_mod.supported_efforts_for("openai-codex", "gpt-5.6-sol") == (
        "low", "medium", "high", "xhigh", "max")
    assert re_mod.supported_efforts_for("openai-codex", "gpt-5.5") == (
        "low", "medium", "high", "xhigh")
    assert "none" not in re_mod.supported_efforts_for("openai-codex", "gpt-5.6-sol")


def test_kimi_boundary():
    assert re_mod.supported_efforts_for("kimi-coding", "kimi-k3") == ("low", "high", "max")
    # K2-era names never match the K3 vocabulary.
    assert re_mod.supported_efforts_for("kimi-coding", "kimi-k2.6") is not None


def test_unknown_routes_return_none():
    assert re_mod.supported_efforts_for("alibaba-token-plan", "qwen3.8-flash") is None
    assert re_mod.supported_efforts_for("zai", "glm-4.7") is None
    assert re_mod.supported_efforts_for(None, None) is None
