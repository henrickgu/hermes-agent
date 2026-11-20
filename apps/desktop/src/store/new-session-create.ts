import { randomUuid } from '@hermes/shared'
import { atom } from 'nanostores'

/**
 * Single-flight latch for a fresh session TILE.
 *
 * A tile's session only exists once `session.create` answers, so a click has
 * nothing to reuse meanwhile: every caller (the sidebar "+" while a chat is
 * open, a split drop, ⌘T, the tab strip, a project drag) would start its own
 * create, and a user who clicks again because "nothing appeared" ends up with
 * one session per click. Clicks that arrive while a create for the SAME intent
 * is in flight join it instead of minting a twin.
 *
 * The request id is the second half of the same problem. The backend derives
 * the session id from `request_id`, so an exact retry resumes the create that
 * was already staged instead of creating another one: a create that failed
 * (typically the client gave up waiting for a ready socket) keeps its id for
 * the next attempt. A create that landed rotates the id, so the next click
 * really is a new session.
 */
export type NewSessionCreateOptions = {
  cwd?: null | string
  profile?: string
  route?: null | { profile?: string }
}

/** Two clicks are the same gesture only when they target the same surface,
 *  folder and profile — a deliberate drop onto a split edge or another
 *  project's "+" must still mint its own session. */
export function newSessionCreateKey(dir: string, options?: NewSessionCreateOptions): string {
  return [dir, options?.cwd ?? '', options?.profile ?? options?.route?.profile ?? ''].join('\u0000')
}

/** True while a tile create is in flight: drives the "creating…" notice. */
export const $newSessionCreating = atom(false)

/** Whether a failed create left something worth resuming. Only the wire did:
 *  a client that gave up waiting for a ready socket may have left a staged or
 *  committed create behind, and reusing its id resumes exactly that one. A
 *  refusal (a changed request, a permission or profile answer) must NOT be
 *  retried under the same id — the backend rejects a request_id whose frozen
 *  request differs, so the "+" would keep failing until the retention expired. */
export function createIdWorthReusing(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)

  return /timed out|timeout|not connected|connection closed|readiness/i.test(message)
}

/** `settled`: the request id is spent, rotate it. `retry`: keep it, the next
 *  click retries the same staged create. */
export type NewSessionCreateOutcome = 'retry' | 'settled'

export type NewSessionCreateAttempt =
  | { joined: Promise<void> }
  | { finish: (outcome: NewSessionCreateOutcome) => void; requestId: string }

const inFlight = new Map<string, Promise<void>>()

// Long enough to cover the click that timed out (30s client budget) plus the
// user's reaction, short enough that a much later "+" is a fresh session.
const RETAIN_MS = 120_000

const retained = new Map<string, { at: number; requestId: string }>()

export function beginNewSessionCreate(key: string): NewSessionCreateAttempt {
  const running = inFlight.get(key)

  if (running) {
    return { joined: running }
  }

  const kept = retained.get(key)

  retained.delete(key)

  const requestId = kept && Date.now() - kept.at < RETAIN_MS ? kept.requestId : randomUuid()

  let settle = () => {}

  const promise = new Promise<void>(resolve => {
    settle = resolve
  })

  inFlight.set(key, promise)
  $newSessionCreating.set(true)

  return {
    requestId,
    finish: outcome => {
      if (inFlight.get(key) === promise) {
        inFlight.delete(key)
      }

      if (outcome === 'retry') {
        retained.set(key, { at: Date.now(), requestId })
      }

      if (inFlight.size === 0) {
        $newSessionCreating.set(false)
      }

      settle()
    }
  }
}

/** Test seam: no latch state may leak between cases. */
export function resetNewSessionCreatesForTests(): void {
  inFlight.clear()
  retained.clear()
  $newSessionCreating.set(false)
}
