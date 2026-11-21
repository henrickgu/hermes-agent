// "Open with…" for ONE local file: on Windows this raises the shell's program
// chooser (the dialog Explorer's own context menu opens) through
// `shell32.dll,OpenAs_RunDLL`. macOS and Linux have no equivalent single-call
// dialog, so they answer `unsupported` — the renderer hides the item when the
// platform can't do it, instead of showing a dead entry.
//
// Split from the IPC surface so it unit-tests without electron, like
// external-open.ts: the spawn implementation and the platform are injected.
import type { spawn } from 'node:child_process'

export type OpenWithResult = { ok: true } | { ok: false; error: string }

export interface OpenWithDeps {
  platform: NodeJS.Platform
  spawn: typeof spawn
}

/** Round-trip through the OS chooser. Resolves as soon as the dialog process is
 *  spawned: the user's pick happens inside the shell, so there is nothing to
 *  await — only a failed launch is an error here. */
export function openWithChooser(targetPath: string, deps: OpenWithDeps): OpenWithResult {
  const target = String(targetPath || '').trim()

  if (!target) {
    return { ok: false, error: 'no path' }
  }

  if (deps.platform !== 'win32') {
    return { ok: false, error: 'unsupported platform' }
  }

  try {
    // A GUI-subsystem helper (no console window), detached so closing it never
    // ties back to the app's process tree.
    deps.spawn('rundll32.exe', ['shell32.dll,OpenAs_RunDLL', target], {
      detached: true,
      stdio: 'ignore',
      windowsHide: false
    }).unref()

    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}
