import { beforeEach, describe, expect, it, vi } from 'vitest'

const loadStore = async () => {
  vi.resetModules()
  return import('./unfocused-chat-dimming')
}

describe('unfocused chat dimming preference', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('preserves the existing dimming behavior by default and persists changes', async () => {
    const first = await loadStore()

    expect(first.$dimUnfocusedChats.get()).toBe(true)
    first.setDimUnfocusedChats(false)
    expect(window.localStorage.getItem('hermes.desktop.appearance.dimUnfocusedChats')).toBe('false')

    const reloaded = await loadStore()
    expect(reloaded.$dimUnfocusedChats.get()).toBe(false)
  })

  it('dims only an unfocused conversation when the preference is enabled', async () => {
    const { shouldDimUnfocusedChat } = await loadStore()

    expect(shouldDimUnfocusedChat(true, false)).toBe(true)
    expect(shouldDimUnfocusedChat(true, true)).toBe(false)
    expect(shouldDimUnfocusedChat(false, false)).toBe(false)
  })
})
