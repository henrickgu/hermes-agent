"""Regression coverage for plugin-provider model validation."""

from unittest.mock import patch

from hermes_cli.models import validate_requested_model


def test_plugin_catalog_model_wins_over_unrelated_live_models_listing():
    """A provider's own catalog must validate models omitted by its /models route."""
    requested = "cline-pass/glm-5.3-flash"

    with (
        patch("hermes_cli.models.fetch_api_models", return_value=["z-ai/glm-5.3-flash"]),
        patch("hermes_cli.models.provider_model_ids", return_value=[requested]),
    ):
        result = validate_requested_model(
            requested,
            "clinepass",
            api_key="test-key",
            base_url="https://api.cline.bot/api/v1",
        )

    assert result == {
        "accepted": True,
        "persist": True,
        "recognized": True,
        "message": (
            f"Note: `{requested}` was not found in the live /v1/models listing "
            "but exists in the provider catalog — accepted."
        ),
    }
