import { afterEach, describe, expect, it, vi } from 'vitest'

import { $gatewayState, $sessions, setSessions } from '@/store/session'
import { $sessionTiles } from '@/store/session-states'

import {
  planSessionTileResumeRetry,
  sessionTileResumeFailure,
  sessionTileResumeRetryDelayMs,
  shouldResumeSessionTile,
  startUnrestoredTileTitleBackfill
} from './session-tile'

describe('shouldResumeSessionTile', () => {
  const live = {
    gatewayOpen: true,
    removalPending: false,
    resuming: false,
    runtimeId: null,
    tileError: undefined
  }

  it('resumes an unbound tile once the gateway is open', () => {
    expect(shouldResumeSessionTile(live)).toBe(true)
  })

  it('does not resume a session the user is deleting', () => {
    // A 4001 racing the delete unbinds the tile runtime, re-arming the resume
    // effect against an id that is already gone: the resume 404s and latches an
    // error card for a chat that is on its way out.
    expect(shouldResumeSessionTile({ ...live, removalPending: true })).toBe(false)
  })

  it('waits for the gateway, a free slot, and an unbound, unlatched tile', () => {
    expect(shouldResumeSessionTile({ ...live, gatewayOpen: false })).toBe(false)
    expect(shouldResumeSessionTile({ ...live, runtimeId: 'rt-1' })).toBe(false)
    expect(shouldResumeSessionTile({ ...live, tileError: 'boom' })).toBe(false)
    expect(shouldResumeSessionTile({ ...live, resuming: true })).toBe(false)
  })
})

describe('sessionTileResumeFailure', () => {
  it('keeps a confirmed durable session retryable instead of repeating a stale 404', () => {
    expect(sessionTileResumeFailure('session not found', true, true)).toBe(
      'Session is still available — retry resuming it.'
    )
  })

  it('fails safe on an inconclusive durable lookup', () => {
    expect(sessionTileResumeFailure('404', false, true)).toBe('Session unavailable — you can retry resuming it.')
  })

  it('does not overwrite a tile that rebound while the lookup was pending', () => {
    expect(sessionTileResumeFailure('session not found', true, false)).toBeUndefined()
  })
})

describe('sessionTileResumeRetryDelayMs', () => {
  it('stays within the 500ms-base jittered ladder and respects its 15s cap', () => {
    for (const attempt of [0, 1, 2, 3, 4, 5, 6, 10]) {
      const delay = sessionTileResumeRetryDelayMs(attempt)

      expect(delay).toBeGreaterThanOrEqual(0)
      expect(delay).toBeLessThan(Math.min(15_000, 500 * 2 ** attempt))
    }
  })
})

describe('planSessionTileResumeRetry', () => {
  it('keeps retrying transient 404s while the gateway is open', () => {
    expect(planSessionTileResumeRetry({ attempt: 0, gatewayOpen: true })).toEqual({
      attemptsLeft: 5,
      delayMs: expect.any(Number)
    })
    expect(planSessionTileResumeRetry({ attempt: 4, gatewayOpen: true })?.attemptsLeft).toBe(1)
  })

  it('latches the error card once the ladder is exhausted', () => {
    expect(planSessionTileResumeRetry({ attempt: 6, gatewayOpen: true })).toBeNull()
    expect(planSessionTileResumeRetry({ attempt: 99, gatewayOpen: true })).toBeNull()
  })

  it('does not retry into a closed/idle gateway — the reopen effect re-arms instead', () => {
    expect(planSessionTileResumeRetry({ attempt: 0, gatewayOpen: false })).toBeNull()
  })

  it('honors an explicit maxAttempts override', () => {
    expect(planSessionTileResumeRetry({ attempt: 2, gatewayOpen: true, maxAttempts: 2 })).toBeNull()
    expect(planSessionTileResumeRetry({ attempt: 1, gatewayOpen: true, maxAttempts: 2 })).toEqual({
      attemptsLeft: 0,
      delayMs: expect.any(Number)
    })
  })
})

describe('startUnrestoredTileTitleBackfill (#94167)', () => {
  afterEach(() => {
    $gatewayState.set('idle')
    $sessionTiles.set([])
    setSessions([])
  })

  it('backfills unlisted unrestored tiles by id via their ownerRoute once the gateway opens', async () => {
    const ownerRoute = { connectionId: 'conn-a', profile: 'writer' }
    setSessions([{ id: 'listed', title: 'Already listed' } as never])
    $sessionTiles.set([
      { ownerRoute, storedSessionId: 'old-chat' },
      { storedSessionId: 'listed' },
      { runtimeId: 'rt-live', storedSessionId: 'live' },
      { storedSessionId: 'bot', workspaceTabTitle: 'Bot Chat' }
    ])

    const lookup = vi.fn(async (id: string) => {
      const row = { id, title: 'Quarterly review' } as never
      setSessions(prev => [row, ...prev])

      return row
    })

    const stop = startUnrestoredTileTitleBackfill(lookup as never)
    expect(lookup).not.toHaveBeenCalled()

    $gatewayState.set('open')
    await vi.waitFor(() => expect(lookup).toHaveBeenCalledTimes(1))
    expect(lookup).toHaveBeenCalledWith('old-chat', ownerRoute)
    expect($sessions.get().find(row => row.id === 'old-chat')?.title).toBe('Quarterly review')

    // One-shot: a later reconnect does not re-probe.
    $gatewayState.set('idle')
    $gatewayState.set('open')
    expect(lookup).toHaveBeenCalledTimes(1)
    stop()
  })
})
