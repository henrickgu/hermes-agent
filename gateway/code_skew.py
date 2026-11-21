"""Detect when the gateway is running stale code after a hot ``git pull``.

The gateway's ``sys.modules`` is frozen at boot.  If the checkout is updated
underneath it, a first-time lazy import can resolve a freshly-pulled module
against a stale cached dependency -> ImportError.  We snapshot the revision at
startup so risky callers (e.g. ``/model`` switching) can refuse with a clear
"restart the gateway" message. Changes confined to the Desktop renderer leave the runtime current.
If the revision can't be read (non-git install,
IO error) the boot snapshot stays ``None`` and detection no-ops — never a false positive.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
import re
import subprocess

from hermes_cli._subprocess_compat import windows_hide_flags

from hermes_cli._startup_fast import project_root_str

_PROJECT_ROOT = Path(project_root_str())
_boot_fingerprint: str | None = None
_COMMIT_SHA = re.compile(r"(?:[0-9a-f]{40}|[0-9a-f]{64})", re.IGNORECASE)


def _fingerprint() -> str | None:
    """Current checkout fingerprint via the CLI's worktree-aware git-rev reader
    (``hermes_cli.main`` is always already imported in a gateway process)."""
    try:
        from hermes_cli.main import _read_git_revision_fingerprint

        return _read_git_revision_fingerprint(_PROJECT_ROOT)
    except Exception:
        return None


def record_boot_fingerprint() -> None:
    """Snapshot the checkout revision at gateway startup (idempotent)."""
    global _boot_fingerprint
    if _boot_fingerprint is None:
        _boot_fingerprint = _fingerprint()


def _short(fingerprint: str) -> str:
    """Render a ``git:<ref>:<sha>`` fingerprint as a compact label."""
    sha = fingerprint.rsplit(":", 1)[-1]
    return sha[:10] if sha and sha != "unresolved" and len(sha) > 10 else (sha or fingerprint)


def current_code_sha() -> str | None:
    """Full SHA for the checkout currently on disk, or None when unresolved."""
    fingerprint = _fingerprint()
    if fingerprint is None:
        return None
    sha = fingerprint.rsplit(":", 1)[-1]
    return sha if sha and sha != "unresolved" else None


@lru_cache(maxsize=16)
def _same_backend_tree(root: Path, previous: str, current: str) -> bool:
    try:
        result = subprocess.run(
            [
                "git", "--no-replace-objects", "diff", "--quiet", "--no-ext-diff", "--no-textconv",
                "--ignore-submodules=none", "--no-relative", previous, current,
                "--", ".", ":(top,exclude)apps/desktop/src",
            ],
            cwd=root, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL, timeout=3, creationflags=windows_hide_flags(),
            check=False,
        )
    except (OSError, subprocess.SubprocessError):
        return False
    return result.returncode == 0


def backend_code_unchanged(previous: str | None, current: str | None) -> bool:
    """Prove from local Git trees that a different revision needs no gateway restart."""
    if not previous or not current or not (_COMMIT_SHA.fullmatch(previous) and _COMMIT_SHA.fullmatch(current)):
        return False
    if previous == current or not (_PROJECT_ROOT / ".git").exists():
        return False
    return _same_backend_tree(_PROJECT_ROOT, previous, current)


def detect_code_skew() -> tuple[str, str] | None:
    """``(boot_rev, disk_rev)`` short labels if the checkout drifted since boot, else ``None``."""
    current = _fingerprint() if _boot_fingerprint is not None else None
    if current is None or current == _boot_fingerprint:
        return None
    if backend_code_unchanged(_boot_fingerprint.rsplit(":", 1)[-1], current.rsplit(":", 1)[-1]):
        return None
    return _short(_boot_fingerprint), _short(current)
