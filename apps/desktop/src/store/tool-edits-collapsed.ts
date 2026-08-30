import { atom } from 'nanostores'

import { persistBoolean, storedBoolean } from '@/lib/storage'

const TOOL_EDITS_COLLAPSED_BY_DEFAULT_STORAGE_KEY = 'hermes.desktop.toolEdits.collapsedByDefault'

/** Desktop-local presentation preference; shared backend config must not be changed by a single window. */
export const $toolEditsCollapsedByDefault = atom(
  storedBoolean(TOOL_EDITS_COLLAPSED_BY_DEFAULT_STORAGE_KEY, false)
)

$toolEditsCollapsedByDefault.subscribe(value =>
  persistBoolean(TOOL_EDITS_COLLAPSED_BY_DEFAULT_STORAGE_KEY, value)
)

export function setToolEditsCollapsedByDefault(value: boolean) {
  $toolEditsCollapsedByDefault.set(value)
}
