"""The catalog carries each route's VERIFIED effort vocabulary.

``native_efforts`` is what the effort menu offers per model. It comes from the
same tables the transport layer clamps against (``supported_efforts_for``), so a
menu never presents a level the route would reject. A route with no table stays
absent — the UI then falls back to its trimmed scale instead of guessing.

Locks the wiring, not the tables: a model that DROPS out of
``_apply_capabilities`` would silently send every model down the fallback path.
"""

from hermes_cli.inventory import _apply_capabilities


def test_verified_route_carries_native_efforts():
    rows = [{"slug": "zai", "models": ["glm-5.3", "glm-5.2"]}]
    _apply_capabilities(rows)
    caps = rows[0]["capabilities"]

    assert caps["glm-5.3"]["native_efforts"] == ["low", "medium", "high", "max"]
    assert caps["glm-5.2"]["native_efforts"] == ["high", "max"]


def test_untabled_route_stays_absent():
    """Unknown model: absent, NOT a guess. The UI falls back to the trimmed scale."""
    rows = [{"slug": "zai", "models": ["glm-4.6"]}]
    _apply_capabilities(rows)

    assert "native_efforts" not in rows[0]["capabilities"]["glm-4.6"]

