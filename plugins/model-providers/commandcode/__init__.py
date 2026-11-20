"""CommandCode provider profiles: ``commandcode`` (chat_completions) and
``commandcode-anthropic`` (anthropic_messages, Bearer auth — see
``agent/anthropic_adapter.py``). Same key and base URL for both."""

import json
import logging
import re
import urllib.request
from datetime import datetime

from hermes_cli.urllib_security import open_credentialed_url
from providers import get_provider_profile, register_provider
from providers.base import ProviderProfile, _profile_user_agent

logger = logging.getLogger(__name__)

_COMMANDCODE_BASE = "https://api.commandcode.ai/provider/v1"
_COMMANDCODE_MODELS_URL = f"{_COMMANDCODE_BASE}/models"
_SUBSCRIPTION_LIMIT = re.compile(r"\breached your (?:5-hour|weekly|monthly) usage limit\b", re.I)
_ZONED_RESET = re.compile(r"\bresets at (\d{4}-\d{2}-\d{2}t\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:z|[+-]\d{2}:\d{2}))\b", re.I)


def _classify_api_error(error, *, status_code, message, **context):
    """Only a NAMED subscription window is terminal; ``RATE_LIMITED`` alone is ordinary throttling.

    ``ProviderProfile`` is a dataclass whose ``classify_api_error`` field defaults to ``None``, so the
    hook has to be passed to the constructor — a subclass method with that name is shadowed by the
    instance attribute ``__init__`` writes.
    """
    if status_code != 429 or not _SUBSCRIPTION_LIMIT.search(message or ""):
        return None
    details = {"usage_window": True, "quota_exhausted": True}
    if match := _ZONED_RESET.search(message):
        try:
            details["reset_at"] = datetime.fromisoformat(match[1].upper()).timestamp()
        except ValueError:
            pass  # The provider's own reset text remains visible even if its timestamp is invalid.
    return {"reason": "billing", "retryable": False, "should_fallback": False,
            "should_rotate_credential": False, "error_context": details}


class CommandCodeProfile(ProviderProfile):
    """CommandCode — OpenAI-compatible chat completions endpoint."""

    def fetch_models(
        self, *, api_key: str | None = None, base_url: str | None = None, timeout: float = 8.0
    ) -> list[str] | None:
        """Public (unauthenticated) /models endpoint. The picker passes base_url
        unconditionally, so only a value differing from the default is a custom endpoint."""
        caller_base = (base_url or "").strip().rstrip("/")
        custom = caller_base and caller_base != _COMMANDCODE_BASE
        models_url = caller_base + "/models" if custom else _COMMANDCODE_MODELS_URL
        try:
            req = urllib.request.Request(models_url)
            req.add_header("Accept", "application/json")
            req.add_header("User-Agent", _profile_user_agent())
            with open_credentialed_url(req, timeout=timeout) as resp:
                data = json.loads(resp.read().decode())
            return [m["id"] for m in data.get("data", []) if isinstance(m, dict) and "id" in m]
        except Exception as exc:
            logger.debug("fetch_models(commandcode): %s", exc)
            return None


    def build_api_kwargs_extras(
        self, *, reasoning_config: dict | None = None, model: str | None = None, **context
    ) -> tuple[dict, dict]:
        """DeepSeek ids (``deepseek/deepseek-v4-flash``) get the native DeepSeek wire
        controls: DeepSeek V4+ defaults to thinking when ``thinking`` is omitted, so
        without them ``/reasoning`` never reaches the request (#95232). Other model
        families stay a no-op — CommandCode declares no reasoning vocabulary for them."""
        m = (model or "").strip()
        if not m.lower().startswith("deepseek/"):
            return {}, {}
        # Registry lookup, not a module import: the deepseek shim is only a loader-injected
        # sys.modules entry, and the registry honours a user override of the profile.
        native = get_provider_profile("deepseek")
        if native is None:
            return {}, {}
        return native.build_api_kwargs_extras(
            reasoning_config=reasoning_config, model=m.split("/", 1)[1], **context,
        )


class CommandCodeAnthropicProfile(CommandCodeProfile):
    """CommandCode — Anthropic Messages API-compatible endpoint."""

    def fetch_models(
        self, *, api_key: str | None = None, base_url: str | None = None, timeout: float = 8.0
    ) -> list[str] | None:
        """Public /models endpoint, filtered to Anthropic-family models."""
        all_models = super().fetch_models(api_key=api_key, base_url=base_url, timeout=timeout)
        return None if all_models is None else [m for m in all_models if m.startswith("claude-")]


commandcode = CommandCodeProfile(
    name="commandcode", aliases=("commandcode-chat",), api_mode="chat_completions",
    # Same key as the anthropic profile; distinct base-URL override vars so each
    # profile renders its own card on the desktop Keys tab (rows keyed by env var).
    env_vars=("COMMANDCODE_API_KEY", "COMMANDCODE_BASE_URL"),
    display_name="CommandCode", description="CommandCode — 20+ models via OpenAI-compatible API",
    signup_url="https://commandcode.ai/", base_url=_COMMANDCODE_BASE, models_url=_COMMANDCODE_MODELS_URL,
    fallback_models=(
        "deepseek/deepseek-v4-pro", "deepseek/deepseek-v4-flash", "Qwen/Qwen3.7-Max", "Qwen/Qwen3.6-Plus",
        "moonshotai/Kimi-K2.6", "zai-org/GLM-5.1", "MiniMaxAI/MiniMax-M2.7", "stepfun/Step-3.5-Flash",
        "xiaomi/mimo-v2.5-pro", "google/gemini-3.5-flash", "gpt-5.5",
    ),
    default_aux_model="deepseek/deepseek-v4-flash",
    classify_api_error=_classify_api_error,
)

commandcode_anthropic = CommandCodeAnthropicProfile(
    name="commandcode-anthropic", aliases=("commandcode-claude",), api_mode="anthropic_messages",
    env_vars=("COMMANDCODE_API_KEY", "COMMANDCODE_ANTHROPIC_BASE_URL"),
    display_name="CommandCode (Anthropic)",
    description="CommandCode — Claude models via Anthropic Messages API",
    signup_url="https://commandcode.ai/", base_url=_COMMANDCODE_BASE, models_url=_COMMANDCODE_MODELS_URL,
    fallback_models=("claude-sonnet-4-6", "claude-opus-4-7", "claude-haiku-4-5-20251001"),
    default_aux_model="claude-haiku-4-5-20251001",
    classify_api_error=_classify_api_error,
)

register_provider(commandcode)
register_provider(commandcode_anthropic)
