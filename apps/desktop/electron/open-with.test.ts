import { describe, expect, it, vi } from 'vitest'

import { openWithChooser } from './open-with'

function fakeSpawn() {
  const unref = vi.fn()
  const spawn = vi.fn(() => ({ unref }))

  return { spawn: spawn as never, unref, calls: spawn }
}

describe('openWithChooser', () => {
  it('raises the Windows program chooser for the given path', () => {
    const { calls, spawn, unref } = fakeSpawn()
    const result = openWithChooser('C:\\Users\\E\\report.pdf', { platform: 'win32', spawn })

    expect(result).toEqual({ ok: true })
    expect(calls).toHaveBeenCalledWith(
      'rundll32.exe',
      ['shell32.dll,OpenAs_RunDLL', 'C:\\Users\\E\\report.pdf'],
      expect.objectContaining({ detached: true, stdio: 'ignore' })
    )
    expect(unref).toHaveBeenCalled()
  })

  it('refuses platforms without a single-call chooser', () => {
    const { calls } = fakeSpawn()

    expect(openWithChooser('/work/report.pdf', { platform: 'darwin', spawn: calls as never })).toEqual({
      ok: false,
      error: 'unsupported platform'
    })
    expect(calls).not.toHaveBeenCalled()
  })

  it('rejects an empty path', () => {
    const { calls } = fakeSpawn()

    expect(openWithChooser('   ', { platform: 'win32', spawn: calls as never })).toEqual({
      ok: false,
      error: 'no path'
    })
    expect(calls).not.toHaveBeenCalled()
  })

  it('reports a spawn failure instead of throwing', () => {
    const spawn = vi.fn(() => {
      throw new Error('spawn ENOENT')
    })

    expect(openWithChooser('C:\\report.pdf', { platform: 'win32', spawn: spawn as never })).toEqual({
      ok: false,
      error: 'spawn ENOENT'
    })
  })
})
