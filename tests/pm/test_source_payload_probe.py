"""Source checkouts must not probe unrelated manifests outside their own tree."""
import json
from pathlib import Path

import pytest

from pm.environments import _payload_manifest, payload_venv


@pytest.mark.parametrize("worktree", [False, True])
def test_git_checkout_never_reads_parent_payload_manifest(tmp_path, monkeypatch, worktree):
    source = tmp_path / "source"
    source.mkdir()
    marker = source / ".git"
    if worktree:
        marker.write_text("gitdir: elsewhere\n", encoding="utf-8")
    else:
        marker.mkdir()
    parent_manifest = tmp_path / "manifest.json"
    original = Path.read_text

    def checked_read(path, *args, **kwargs):
        if path == parent_manifest:
            raise AssertionError("source checkout probed its unrelated parent")
        return original(path, *args, **kwargs)

    monkeypatch.setattr(Path, "read_text", checked_read)
    assert _payload_manifest(source) is None
    assert payload_venv(source) is None


def test_sealed_gitless_tree_keeps_its_payload_environment(tmp_path):
    source = tmp_path / "source"
    source.mkdir()
    (tmp_path / "manifest.json").write_text(
        json.dumps({"repo": "source", "venv": "environment", "runtime": {"commands": {}}}),
        encoding="utf-8",
    )
    assert payload_venv(source) == tmp_path / "environment"
