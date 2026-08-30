import { atom } from 'nanostores'

import { persistBoolean, storedBoolean } from '@/lib/storage'

const STORAGE_KEY = 'hermes.desktop.appearance.dimUnfocusedChats'

/** Desktop-local presentation preference; enabled preserves the existing multi-pane treatment. */
export const $dimUnfocusedChats = atom(storedBoolean(STORAGE_KEY, true))

$dimUnfocusedChats.subscribe(value => persistBoolean(STORAGE_KEY, value))

export function setDimUnfocusedChats(value: boolean) {
  $dimUnfocusedChats.set(value)
}

export function shouldDimUnfocusedChat(enabled: boolean, focused: boolean): boolean {
  return enabled && !focused
}
