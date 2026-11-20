import { useEffect } from 'react'
import { useLocation } from 'react-router'

import { routeSessionId } from '@/app/routes'
import { transcriptRestScope } from '@/app/session/hooks/use-session-actions/provisional-transcript'
import { cachedSessionRow } from '@/app/session/hooks/use-session-actions/utils'
import { ambientOwnerConnectionId } from '@/api/client'
import { getLatestSessionMessages } from '@/hermes'
import { toChatMessages } from '@/lib/chat-messages'
import { $messages, $selectedStoredSessionId, setMessages } from '@/store/session'
import type { SessionMessagesResponse } from '@/types/hermes'

type RestScope = ReturnType<typeof transcriptRestScope>

const PRIMED_TTL_MS = 30_000

interface PrimedRead {
  at: number
  promise: Promise<SessionMessagesResponse>
  scopeKey: string
}

// One read per session, shared between the route paint and the resume that
// follows it: the route cannot wait for the resume (that is an attach: row
// repairs, session info, agent pre-warm — 0.5-7 s measured on this machine),
// and the resume must not pay for a second copy of the page it is about to
// graft onto the same snapshot.
const primedReads = new Map<string, PrimedRead>()

const scopeKey = (scope: RestScope) => JSON.stringify(scope ?? null)

/**
 * Start (or join) the transcript read for `storedSessionId`.
 *
 * With no explicit scope the caller wants whatever the stored row's own owner
 * is — the same scope `transcriptRestScope` hands the resume, so both callers
 * land on ONE request.
 */
export function primeRouteTranscript(storedSessionId: string, scope?: RestScope): Promise<SessionMessagesResponse> {
  const now = Date.now()

  for (const [id, entry] of primedReads) {
    if (now - entry.at > PRIMED_TTL_MS) {
      primedReads.delete(id)
    }
  }

  const resolvedScope =
    scope ?? transcriptRestScope(undefined, cachedSessionRow(storedSessionId), ambientOwnerConnectionId() ?? '')
  const key = scopeKey(resolvedScope)
  const existing = primedReads.get(storedSessionId)

  if (existing && existing.scopeKey === key) {
    return existing.promise
  }

  const promise = getLatestSessionMessages(storedSessionId, resolvedScope).catch(error => {
    primedReads.delete(storedSessionId)

    throw error
  })

  primedReads.set(storedSessionId, { at: now, promise, scopeKey: key })

  return promise
}

/**
 * Take the in-flight read a resume is about to use, but only when it targets
 * the same owner. A mismatch (another profile / connection) leaves the primed
 * read to the route paint and makes the caller issue its own scoped read.
 */
export function adoptPrimedTranscript(
  storedSessionId: string,
  scope: RestScope
): Promise<SessionMessagesResponse> | null {
  const entry = primedReads.get(storedSessionId)

  if (!entry) {
    return null
  }

  primedReads.delete(storedSessionId)

  return entry.scopeKey === scopeKey(scope) ? entry.promise : null
}

/**
 * Paint the stored transcript the moment the route lands, without waiting for
 * `session.resume`.
 *
 * The resume is an ATTACH (row repairs, session info, background agent build);
 * the transcript is one REST page — ~1 MB and tens of ms of real work for a
 * 373-message session. The resume path already paints that page before
 * awaiting the RPC, but only after its own profile/gateway awaits, and not at
 * all while the socket is reconnecting.
 *
 * Deliberately additive: it can only ever ADD a transcript.
 *  - primary view only, and only while nothing else is painted;
 *  - paints only if the route AND the selection still point at the session;
 *  - re-checks `$messages` when the page returns, so the resume's own graft
 *    (which reconciles pending turns and provenance) always wins the race.
 */
export function useRouteTranscriptPaint({
  enabled,
  routedSessionId,
  transcriptEmpty
}: {
  enabled: boolean
  routedSessionId: null | string
  transcriptEmpty: boolean
}) {
  const location = useLocation()

  useEffect(() => {
    if (!enabled || !routedSessionId || !transcriptEmpty) {
      return
    }

    let cancelled = false
    const startedAt = performance.now()
    // console.error: the only console level the packaged app forwards to
    // desktop.log (`[renderer console:main]`).
    console.error(`[open-latency #1] arm ${routedSessionId.slice(0, 18)}`)

    void primeRouteTranscript(routedSessionId)
      .then(page => {
        if (cancelled) {
          return
        }

        if (routeSessionId(location.pathname) !== routedSessionId) {
          return
        }

        // Selection is committed synchronously at resume entry, before its
        // awaits; a mismatch here means the click was already abandoned.
        if ($selectedStoredSessionId.get() !== routedSessionId) {
          console.error(
            `[open-latency #2] drop ${routedSessionId.slice(0, 18)} ${(performance.now() - startedAt).toFixed(0)}ms`
          )

          return
        }

        if ($messages.get().length > 0) {
          console.error(
            `[open-latency #3] skip ${routedSessionId.slice(0, 18)} resume won ${(performance.now() - startedAt).toFixed(0)}ms`
          )

          return
        }

        setMessages(toChatMessages(page.messages))
        console.error(
          `[open-latency #4] painted ${routedSessionId.slice(0, 18)} rows=${page.messages.length} ${(performance.now() - startedAt).toFixed(0)}ms`
        )
      })
      .catch(error => {
        console.error(
          `[open-latency #5] failed ${routedSessionId.slice(0, 18)} ${(performance.now() - startedAt).toFixed(0)}ms ${String(error).slice(0, 120)}`
        )
      })

    return () => {
      cancelled = true
    }
  }, [enabled, location.pathname, routedSessionId, transcriptEmpty])
}
