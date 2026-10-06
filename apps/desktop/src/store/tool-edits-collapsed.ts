import { atom } from 'nanostores'

import { persistBoolean, storedBoolean } from '@/lib/storage'

const TOOL_EDITS_COLLAPSED_BY_DEFAULT_STORAGE_KEY = 'hermes.desktop.toolEdits.collapsedByDefault'

/** Desktop-local presentation preference; shared backend config must not be changed by a single window. */
// Edits mount collapsed: an agent turn runs dozens of them and every open
// diff is a wall of code between the user and the reply. `false` here was the
// shipped default that made a heavy session read as mostly code.
export const $toolEditsCollapsedByDefault = atom(
  storedBoolean(TOOL_EDITS_COLLAPSED_BY_DEFAULT_STORAGE_KEY, true)
)

$toolEditsCollapsedByDefault.subscribe(value =>
  persistBoolean(TOOL_EDITS_COLLAPSED_BY_DEFAULT_STORAGE_KEY, value)
)

export function setToolEditsCollapsedByDefault(value: boolean) {
  $toolEditsCollapsedByDefault.set(value)
}
