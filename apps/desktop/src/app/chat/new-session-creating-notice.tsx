import { useStore } from '@nanostores/react'
import { useEffect, useMemo, useState } from 'react'

import { useI18n } from '@/i18n'
import { type ButterbarItem, useButterbar } from '@/store/butterbar'
import { $newSessionCreating } from '@/store/new-session-create'

// A create usually answers in well under a second, and the bar should never
// flash for those. It appears only when the wait is long enough to read as "my
// click did nothing" — which is precisely when the user starts clicking again.
const NOTICE_DELAY_MS = 400

/** "Creating a new session…" while a fresh tile's `session.create` is in
 *  flight. The button latches repeated clicks (store/new-session-create), so
 *  this bar is the answer to "did anything happen?": without it a slow create
 *  is 30 seconds of dead air followed by an error toast. */
export function NewSessionCreatingNotice() {
  const creating = useStore($newSessionCreating)
  const [shown, setShown] = useState(false)
  const label = useI18n().t.desktop.newSessionCreating

  useEffect(() => {
    if (!creating) {
      setShown(false)

      return
    }

    const timer = window.setTimeout(() => setShown(true), NOTICE_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [creating])

  const item = useMemo<ButterbarItem | null>(
    () => (shown ? { id: 'new-session-creating', node: label, tone: 'info' } : null),
    [label, shown]
  )

  useButterbar(item)

  return null
}
