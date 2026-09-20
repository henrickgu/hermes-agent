"""The session's reasoning pick must SURVIVE a model switch.

A user who picked ``low`` on the pill and then switched models (or had a
session rebuilt after a switch) must keep ``low``: the pick travels with the
conversation. ``switch_model`` re-resolved ``agent.reasoning_config`` from the
GLOBAL ``agent.reasoning_effort`` and silently overwrote the session's level
with the profile default (proven repro: desktop session created at ``low``,
agent.log showed ``switch_model: reasoning_config resolved ... effort:
'medium'`` 25s later, state.db still recorded ``low``).

Rule implemented: an explicit session-level override wins; the global config
only fills the case where the session never expressed a preference.
"""

from unittest.mock import MagicMock, patch

from agent.agent_runtime_helpers import switch_model
from tests.agent.test_primary_runtime_restore import _make_agent

# switch_model imports the config loader LOCALLY (inside the function body),
# so the patch target is the source module, not agent_runtime_helpers.
_CONFIG = "hermes_cli.config.load_config"


def _switch(agent, **kwargs):
    with (
        patch("agent.process_bootstrap.OpenAI", return_value=MagicMock()),
        patch(
            "agent.model_metadata.get_model_context_length",
            return_value=128_000,
        ),
    ):
        switch_model(
            agent,
            new_model=kwargs.get("new_model", "gpt-4o"),
            new_provider=kwargs.get("new_provider", "openai"),
            base_url=kwargs.get("base_url", "https://api.openai.com/v1"),
            api_key=kwargs.get("api_key", "«redacted:sk-…»"),
        )


class TestSwitchModelKeepsSessionEffort:
    def test_session_override_survives_switch(self):
        """A picked level is not re-resolved from the global config."""
        agent = _make_agent()
        agent.reasoning_config = {"enabled": True, "effort": "low"}

        with patch(
            _CONFIG,
            return_value={"agent": {"reasoning_effort": "medium"}},
        ):
            _switch(agent)

        assert agent.reasoning_config == {"enabled": True, "effort": "low"}

    def test_switch_logs_the_level_actually_applied(self):
        agent = _make_agent()
        agent.reasoning_config = {"enabled": True, "effort": "high"}

        with (
            patch(
                _CONFIG,
                return_value={"agent": {"reasoning_effort": "medium"}},
            ),
            patch("agent.agent_runtime_helpers.logger") as log,
        ):
            _switch(agent)

        logged = " ".join(str(c) for c in log.info.call_args_list)
        assert "high" in logged
        assert "medium" not in logged

    def test_global_config_still_seeds_when_no_session_pick(self):
        """Without a session preference the profile default still applies."""
        agent = _make_agent()
        agent.reasoning_config = None

        with patch(
            _CONFIG,
            return_value={"agent": {"reasoning_effort": "medium"}},
        ):
            _switch(agent)

        assert agent.reasoning_config == {"enabled": True, "effort": "medium"}

    def test_disabled_thinking_stays_disabled(self):
        """``none`` is a user decision, not a missing value."""
        agent = _make_agent()
        agent.reasoning_config = {"enabled": False}

        with patch(
            _CONFIG,
            return_value={"agent": {"reasoning_effort": "medium"}},
        ):
            _switch(agent)

        assert agent.reasoning_config == {"enabled": False}

    def test_level_unsupported_by_new_model_clamps_down(self):
        """A level the new route cannot serve degrades to the nearest weaker
        one — never upward (cost guard), never silently dropped."""
        agent = _make_agent()
        agent.reasoning_config = {"enabled": True, "effort": "max"}

        with (
            patch(
                _CONFIG,
                return_value={
                    "agent": {
                        "reasoning_effort": "medium",
                        "reasoning_overrides": {"gpt-4o": "max"},
                    }
                },
            ),
            patch(
                "agent.agent_runtime_helpers._switch_route_efforts",
                return_value=("low", "medium", "high"),
            ),
        ):
            _switch(agent)

        assert agent.reasoning_config == {"enabled": True, "effort": "high"}

    def test_per_model_override_does_not_revive_a_pick(self):
        """The config's per-model table only matters when the session itself
        expressed no preference — it must not override the user's pick."""
        agent = _make_agent()
        agent.reasoning_config = {"enabled": True, "effort": "low"}

        with patch(
            _CONFIG,
            return_value={
                "agent": {
                    "reasoning_effort": "medium",
                    "reasoning_overrides": {"gpt-4o": "max"},
                }
            },
        ):
            _switch(agent)

        assert agent.reasoning_config == {"enabled": True, "effort": "low"}
