import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  setCurrentModel,
  setCurrentModelSource,
  setCurrentProvider,
  setCurrentReasoningEffort,
  getCurrentModelSource
} from '@/store/session'
import { computeLastUsedSelection, getCurrentComposerScope, noteModelSelectionInUse } from '@/store/session'

// The params builder touches two store/profile helpers that dial the gateway
// registry — the model/provider precedence under test never depends on them.
vi.mock('@/store/profile', async importOriginal => {
  const actual = await importOriginal<typeof import('@/store/profile')>()

  return {
    ...actual,
    ensureGatewayProfile: vi.fn(async () => undefined),
    resolveNewChatOwnerRoute: vi.fn(() => null)
  }
})

import { desktopSessionCreateParams } from './index'

/**
 * v16c — the create-params precedence, asserted directly at the
 * linearization point New Session actually uses:
 *
 *   manual composer  >  scope-matched sticky  >  backend default (no override)
 *
 * The repro this pins: a confirmed pick on a focused TILE updates the sticky
 * (never the primary composer). The next New Session — opened with the
 * composer still on the boot default — must be created on the STICKY's pair,
 * not the stale composer.
 */
describe('desktopSessionCreateParams model precedence (v16c)', () => {
  beforeEach(() => {
    setCurrentModel('glm-5.3')
    setCurrentProvider('zai')
    setCurrentModelSource('default')
    setCurrentReasoningEffort('high', 'draft-init')
    window.localStorage.removeItem('hermes.desktop.composer.last-model')
    window.localStorage.removeItem('hermes.desktop.composer.last-provider')
    window.localStorage.removeItem('hermes.desktop.composer.last-scope')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.removeItem('hermes.desktop.composer.last-model')
    window.localStorage.removeItem('hermes.desktop.composer.last-provider')
    window.localStorage.removeItem('hermes.desktop.composer.last-scope')
  })

  it('source=default + sticky Flash válido (scope casante) → create em Flash', async () => {
    // The repro: tile pick confirmed, sticky = Flash, primary composer still
    // shows the boot default (glm-5.3) with source 'default'.
    noteModelSelectionInUse('glm-5.3-flash', 'zai', getCurrentComposerScope())

    const params = await desktopSessionCreateParams('')

    expect(params.model).toBe('glm-5.3-flash')
    expect(params.provider).toBe('zai')
  })

  it('manual composer vence o sticky', async () => {
    // A manual pick on the composer is the user's CURRENT choice — it beats
    // whatever ran last.
    setCurrentModel('grok-4.5')
    setCurrentProvider('xai')
    setCurrentModelSource('manual')
    noteModelSelectionInUse('glm-5.3-flash', 'zai', getCurrentComposerScope())

    const params = await desktopSessionCreateParams('')

    expect(params.model).toBe('grok-4.5')
    expect(params.provider).toBe('xai')
  })

  it('sticky de scope incompatível não viaja', async () => {
    // v14b rule: a sticky minted under another gateway scope legitimately
    // loses to that context's own default — no model/provider override.
    noteModelSelectionInUse('glm-5.3-flash', 'zai', 'conn:other-box::default')

    const params = await desktopSessionCreateParams('')

    expect(params.model).toBeUndefined()
    expect(params.provider).toBeUndefined()
  })

  it('sticky vazio não viaja (primeiro uso)', async () => {
    const params = await desktopSessionCreateParams('')

    expect(params.model).toBeUndefined()
    expect(params.provider).toBeUndefined()
  })

  it('sticky atualiza no meio do caminho é o que o create lê (janela do repro)', async () => {
    // The exact repro ordering: composer resolved at boot (default), the
    // sticky lands LATER (tile confirmation) — the create snapshot must read
    // the sticky AT CREATE TIME, which is what the fresh draft runs on.
    expect(getCurrentModelSource()).toBe('default')
    noteModelSelectionInUse('glm-5.3-flash', 'zai', getCurrentComposerScope())

    const params = await desktopSessionCreateParams('')

    expect(computeLastUsedSelection().model).toBe('glm-5.3-flash')
    expect(params.model).toBe('glm-5.3-flash')
  })
})
