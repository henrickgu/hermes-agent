import { useEffect } from 'react'
import { useLocation } from 'react-router'

import { routeSessionId } from '@/app/routes'
import { transcriptRestScope } from '@/app/session/hooks/use-session-actions/provisional-transcript'
import { cachedSessionRow } from '@/app/session/hooks/use-session-actions/utils'
import { ambientOwnerConnectionId } from '@/api/client'
import { getLatestSessionMessages } from '@/hermes'
import { toChatMessages } from '@/lib/chat-messages'
import { $messages, $selectedStoredSessionId, setMessages } from '@/store/session'

const scopeFor = (storedSessionId: string) =>
  transcriptRestScope(undefined, cachedSessionRow(storedSessionId), ambientOwnerConnectionId() ?? '')

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

    void getLatestSessionMessages(routedSessionId, scopeFor(routedSessionId))
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
