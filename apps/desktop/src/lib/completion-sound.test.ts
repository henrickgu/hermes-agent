import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { getAudioContext } = vi.hoisted(() => ({ getAudioContext: vi.fn(() => null) }))

vi.mock('@/lib/audio-context', () => ({ getAudioContext }))

import { $hapticsMuted } from '@/store/haptics'
import { $activeSessionId } from '@/store/session'
import { $sessionTiles } from '@/store/session-states'

import { playCompletionSound, sessionIsVisible } from './completion-sound'

// getAudioContext is the first call inside the play path, so "was it reached?"
// doubles as the assertion: the visible-session gate must return before it.
function tile(runtimeId: string) {
  return { storedSessionId: `stored-${runtimeId}`, runtimeId }
}

describe('completion sound visible-session gate', () => {
  beforeEach(() => {
    $hapticsMuted.set(false)
    $activeSessionId.set(null)
    $sessionTiles.set([])
    getAudioContext.mockClear()
  })

  afterEach(() => {
    $hapticsMuted.set(false)
    $activeSessionId.set(null)
    $sessionTiles.set([])
  })

  it('sessionIsVisible: true for the focused chat', () => {
    $activeSessionId.set('s-active')

    expect(sessionIsVisible('s-active')).toBe(true)
  })

  it('sessionIsVisible: true for a session bound to an open tile', () => {
    $sessionTiles.set([tile('s-tile')])

    expect(sessionIsVisible('s-tile')).toBe(true)
  })

  it('sessionIsVisible: false for hidden worker/subagent sessions', () => {
    $activeSessionId.set('s-active')
    $sessionTiles.set([tile('s-tile')])

    expect(sessionIsVisible('s-hidden')).toBe(false)
    expect(sessionIsVisible('')).toBe(false)
  })

  it('plays for a visible session and skips hidden ones', async () => {
    $activeSessionId.set('s-active')

    playCompletionSound('s-active')
    await vi.waitFor(() => expect(getAudioContext).toHaveBeenCalledTimes(1))

    playCompletionSound('s-hidden')
    await Promise.resolve()
    await Promise.resolve()
    expect(getAudioContext).toHaveBeenCalledTimes(1)
  })

  it('a session visible only through its tile also plays', async () => {
    $sessionTiles.set([tile('s-tile')])

    playCompletionSound('s-tile')
    await vi.waitFor(() => expect(getAudioContext).toHaveBeenCalledTimes(1))
  })

  it('keeps the legacy always-play when no session id is passed', async () => {
    playCompletionSound()
    await vi.waitFor(() => expect(getAudioContext).toHaveBeenCalledTimes(1))
  })

  it('mute still wins over visibility', async () => {
    $activeSessionId.set('s-active')
    $hapticsMuted.set(true)

    playCompletionSound('s-active')
    await Promise.resolve()
    await Promise.resolve()
    expect(getAudioContext).not.toHaveBeenCalled()
  })
})
