"""CommandCode subscription 429s must not enter the transport retry/fallback path."""
from datetime import datetime

import httpx
from openai import OpenAI, RateLimitError
import pytest

from agent.error_classifier import FailoverReason, classify_api_error


@pytest.mark.parametrize('window', ['5-hour', 'weekly', 'monthly'])
def test_commandcode_quota_window_stops_one_http_attempt(window):
    calls = []
    message = f"You've reached your {window} usage limit. Your limit resets at 2099-01-01T05:00:00Z."

    def send(request):
        calls.append(request.url.path)
        return httpx.Response(429, json={'error': {'message': message, 'type': 'rate_limit_error', 'code': 'RATE_LIMITED'}})

    with OpenAI(api_key='offline-fixture', max_retries=0, base_url='https://api.commandcode.ai/provider/v1',
                http_client=httpx.Client(transport=httpx.MockTransport(send))) as client:
        for _ in range(3):
            with pytest.raises(RateLimitError) as exc:
                client.chat.completions.create(model='moonshotai/Kimi-K3.1-Pro', messages=[{'role': 'user', 'content': 'fixture'}])
            verdict = classify_api_error(exc.value, provider='commandcode')
            if not verdict.retryable:
                break

    assert calls == ['/provider/v1/chat/completions']
    assert verdict.reason is FailoverReason.billing
    assert not verdict.should_rotate_credential
    assert not verdict.should_fallback
    assert not verdict.should_compress
    assert verdict.error_context['usage_window'] is True
    assert verdict.error_context['reset_at'] == datetime.fromisoformat('2099-01-01T05:00:00+00:00').timestamp()


def test_commandcode_minute_throttle_keeps_retry_behavior():
    error = RateLimitError('Rate limit exceeded: requests per minute. Retry after 2 seconds',
                           response=httpx.Response(429, request=httpx.Request('POST', 'https://api.commandcode.ai'),
                                                   headers={'Retry-After': '2'}), body=None)
    verdict = classify_api_error(error, provider='commandcode')
    assert verdict.reason is FailoverReason.rate_limit
    assert verdict.retryable


def test_commandcode_unzoned_reset_keeps_provider_notice_without_guessing_timezone():
    message = "You've reached your 5-hour usage limit. Your limit resets at 2099-01-01T05:00:00."
    error = RateLimitError(message, response=httpx.Response(429, request=httpx.Request('POST', 'https://api.commandcode.ai')),
                           body={'error': {'message': message}})
    verdict = classify_api_error(error, provider='commandcode')
    assert not verdict.retryable
    assert 'reset_at' not in verdict.error_context
    assert '2099-01-01T05:00:00' in verdict.message
