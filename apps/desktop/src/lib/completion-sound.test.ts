import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { getAudioContext } = vi.hoisted(() => ({ getAudioContext: vi.fn(() => null) }))

vi.mock('@/lib/audio-context', () => ({ getAudioContext }))

import {
  $completionSoundVariantId,
  DEFAULT_COMPLETION_SOUND_VARIANT_ID,
  NO_COMPLETION_SOUND_VARIANT_ID
} from '@/store/completion-sound'
import { $hapticsMuted, setHapticsMuted } from '@/store/haptics'
import { $activeSessionId } from '@/store/session'
import { $sessionTiles } from '@/store/session-states'

import { playCompletionSound, previewCompletionSound, sessionIsVisible } from './completion-sound'

// getAudioContext is the first call inside the play path, so "was it reached?"
// doubles as the assertion: the visible-session gate must return before it.
function tile(runtimeId: string) {
  return { storedSessionId: `stored-${runtimeId}`, runtimeId }
}

const original = window.hermesDesktop

afterEach(() => {
  window.hermesDesktop = original
  setHapticsMuted(false)
  $completionSoundVariantId.set(DEFAULT_COMPLETION_SOUND_VARIANT_ID)
  $hapticsMuted.set(false)
  $activeSessionId.set(null)
  $sessionTiles.set([])
  getAudioContext.mockClear()
})

describe('completion sound visible-session gate', () => {
  beforeEach(() => {
    $hapticsMuted.set(false)
    $activeSessionId.set(null)
    $sessionTiles.set([])
    getAudioContext.mockClear()
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

// Check completion cue ownership races without opening a real audio device.
describe('completion sound ownership and the None variant', () => {
  it('rechecks mute after ownership resolves, including a failed claim and a later retry', async () => {
    // The merged module stays silent for sessions nothing on screen shows, so
    // make the dedupe key a visible one before exercising the claim path.
    $activeSessionId.set('session')

    for (const fail of [false, true]) {
      let resolve!: (owns: boolean) => void
      let reject!: (error: Error) => void

      const pending = new Promise<boolean>((yes, no) => {
        resolve = yes
        reject = no
      })

      const claim = vi.fn(() => pending)
      window.hermesDesktop = { ...original, claimAmbientCue: claim }
      setHapticsMuted(false)
      playCompletionSound('session')
      expect(claim).toHaveBeenCalledWith('sound:session')
      setHapticsMuted(true)

      if (fail) {
        reject(new Error('Ownership bridge unavailable'))
      } else {
        resolve(true)
      }

      // Drain the real ownership helper and its completion callback.
      await pending.catch(() => undefined)
      await Promise.resolve()
      expect(getAudioContext).not.toHaveBeenCalled()
      playCompletionSound('session')
      expect(claim).toHaveBeenCalledTimes(1)
    }

    setHapticsMuted(false)
    window.hermesDesktop = { ...original, claimAmbientCue: vi.fn(async () => true) }
    playCompletionSound('session')
    await Promise.resolve()
    await Promise.resolve()
    expect(getAudioContext).toHaveBeenCalledTimes(1)
    expect($hapticsMuted.get()).toBe(false)
  })

  it('stays silent on None and never claims the cue from an audible peer', () => {
    $activeSessionId.set('session')
    const claim = vi.fn(async () => true)
    window.hermesDesktop = { ...original, claimAmbientCue: claim }
    $completionSoundVariantId.set(NO_COMPLETION_SOUND_VARIANT_ID)

    playCompletionSound('session')
    previewCompletionSound()

    expect(claim).not.toHaveBeenCalled()
    expect(getAudioContext).not.toHaveBeenCalled()
  })
})
