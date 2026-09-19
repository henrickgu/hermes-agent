import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ClientSessionState } from '@/app/types'
import { createClientSessionState } from '@/lib/chat-runtime'
import {
  $currentCwd,
  $currentFastMode,
  $draftReasoningEffort,
  $currentServiceTier,
  $selectedStoredSessionId,
  $workspaceCwdOwner,
  releaseWorkspaceCwdOwner,
  setCurrentCwd,
  setCurrentFastMode,
  setCurrentModel,
  setCurrentModelSource,
  setCurrentProvider,
  $currentModel,
  $currentProvider,
  setCurrentReasoningEffort,
  setCurrentServiceTier,
  setSelectedStoredSessionId
} from '@/store/session'
import { persistString } from '@/lib/storage'

import { handleSessionInfoEvent } from './session-info'
import {
  registerPendingModelPick,
  resetPendingModelPicksForTests,
  setActiveRuntimeProvider,
  consumePendingModelPick
} from '@/lib/model-pick-pending'
import type { GatewayEventContext } from './types'

// `_session_info` stamps `stored_session_id: session_key or ""`, so every
// not-yet-persisted session on the gateway emits an UNNAMED session.info that
// still carries a real cwd.
function sessionInfoEvent({
  activeSessionId,
  cwd = '',
  explicitSid = '',
  storedSessionId = '',
  reasoningEffort,
  fast,
  model,
  provider
}: {
  activeSessionId: null | string
  cwd?: string
  explicitSid?: string
  storedSessionId?: string
  reasoningEffort?: string
  fast?: boolean
  model?: string
  provider?: string
}): GatewayEventContext {
  const sessionId = explicitSid || activeSessionId

  return {
    deps: {
      activeGatewayProfile: 'default',
      activeSessionIdRef: { current: activeSessionId },
      hydrateFromStoredSession: vi.fn(),
      lastCwdInfoSessionRef: { current: null },
      queryClient: { invalidateQueries: vi.fn() },
      refreshHermesConfig: vi.fn(),
      scheduleSessionsRefresh: vi.fn(),
      sessionInterrupted: () => false,
      sessionStateByRuntimeIdRef: { current: new Map() },
      updateSessionState: vi.fn(state => state),
      upsertToolCall: vi.fn()
    },
    event: { profile: 'default', session_id: explicitSid, type: 'session.info' },
    explicitSid,
    fromActiveSource: () => true,
    isActiveEvent: !!sessionId && sessionId === activeSessionId,
    occurredAt: Date.now() / 1000,
    payload: {
      cwd,
      stored_session_id: storedSessionId,
      ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
      ...(fast !== undefined ? { fast } : {}),
      ...(model !== undefined ? { model } : {}),
      ...(provider !== undefined ? { provider } : {})
    },
    scheduleConfigRefresh: vi.fn(),
    sessionId
  } as unknown as GatewayEventContext
}

describe('handleSessionInfoEvent workspace ownership', () => {
  beforeEach(() => {
    $selectedStoredSessionId.set(null)
    $workspaceCwdOwner.set(null)
    setCurrentCwd('')
  })

  afterEach(() => {
    $selectedStoredSessionId.set(null)
    $workspaceCwdOwner.set(null)
    setCurrentCwd('')
  })

  // #55831 / the "workspace pane visible with no agent selected" report: with
  // nothing selected an unscoped event is exactly the one that applies, and
  // `broadcast_session_info` re-emits for EVERY live session at once. Adopting
  // those repointed the pane at a stranger's folder and claimed it for the null
  // selection, so the tree/coding rail painted it until the next release
  // un-painted it — a flicker per fan-out, with no agent selected at all.
  it('ignores an unnamed broadcast from a session the pane is not bound to', () => {
    releaseWorkspaceCwdOwner()
    const unowned = $workspaceCwdOwner.get()

    handleSessionInfoEvent(sessionInfoEvent({ activeSessionId: null, cwd: '/repo/someone-elses-worktree' }))

    expect($currentCwd.get()).toBe('')
    expect($workspaceCwdOwner.get()).toBe(unowned)
  })

  it('does not let a fan-out of unnamed broadcasts walk the workspace path', () => {
    const cwds = ['/repo/one', '/repo/two', '/repo/three']

    for (const cwd of cwds) {
      handleSessionInfoEvent(sessionInfoEvent({ activeSessionId: null, cwd }))
    }

    expect($currentCwd.get()).toBe('')
  })

  // v8: effort/fast/tier are session-facts. An UNNAMED broadcast (the gateway's
  // fan-out for background sessions) must not repaint the draft composer — a
  // background GLM ultra turn used to flip the pill medium → ultra with no user
  // action while the user sat on a fresh chat.
  it('does not let an unnamed broadcast repaint the draft composer effort', () => {
    handleSessionInfoEvent(
      sessionInfoEvent({ activeSessionId: null, reasoningEffort: 'ultra', fast: true })
    )

    expect($draftReasoningEffort.get()).not.toBe('ultra')
    expect($currentFastMode.get()).toBe(false)
  })

  // …but the pane's own runtime (explicit, active sid) still applies it — to the
  // SESSION SLICE, not to the draft preference (v12 ownership): the pill reads
  // the slice while the session is active, and the draft atom is untouched.
  it('applies effort from the pane own active runtime session.info to the slice only', () => {
    const state = { ...createClientSessionState('stored-1'), reasoningEffort: 'medium' }
    const ctx = sessionInfoEvent({
      activeSessionId: 'runtime-1',
      explicitSid: 'runtime-1',
      reasoningEffort: 'high'
    })
    ctx.deps.sessionStateByRuntimeIdRef.current.set('runtime-1', state)
    // Apply the updater like the real updateSessionState does — the handler must
    // route the session fact into the slice, and only there.
    ctx.deps.updateSessionState = vi.fn(
      (_sessionId: string, updater: (s: ClientSessionState) => ClientSessionState) => {
        const next = updater(state)
        Object.assign(state, next)

        return next
      }
    )

    handleSessionInfoEvent(ctx)

    expect(state.reasoningEffort).toBe('high')
    // No draft was seeded in this describe — the v12 assertion is that the
    // runtime write went to the SLICE ONLY, whatever the atom held.
    expect($draftReasoningEffort.get()).toBe('')
  })

  // The case the absent-id allowance exists for: a lazy session that has not
  // been persisted yet is still the runtime this pane is bound to, so its cwd
  // must be adopted and owned — otherwise the workspace reads as un-owned for
  // the rest of the conversation.
  it('adopts an unnamed session.info from the pane its own runtime', () => {
    $selectedStoredSessionId.set('selected-session')

    handleSessionInfoEvent(
      sessionInfoEvent({ activeSessionId: 'runtime-1', cwd: '/repo/mine', explicitSid: 'runtime-1' })
    )

    expect($currentCwd.get()).toBe('/repo/mine')
    expect($workspaceCwdOwner.get()).toBe('selected-session')
  })

  it('keeps runtime state identity when a heartbeat only restates cached fields', () => {
    const original = {
      ...createClientSessionState('stored-1'),
      cwd: '/repo/mine',
      fast: true,
      model: 'model-1',
      provider: 'provider-1'
    }

    const ctx = sessionInfoEvent({
      activeSessionId: 'runtime-1',
      cwd: '/repo/mine',
      explicitSid: 'runtime-1',
      storedSessionId: 'stored-1'
    })

    let next: ClientSessionState | undefined

    ctx.payload = {
      ...ctx.payload,
      fast: true,
      model: 'model-1',
      provider: 'provider-1'
    }
    ctx.deps.sessionStateByRuntimeIdRef.current.set('runtime-1', original)
    ctx.deps.updateSessionState = vi.fn(
      (_sessionId: string, updater: (state: ClientSessionState) => ClientSessionState) => {
        const updated = updater(original)
        next = updated

        return updated
      }
    )

    handleSessionInfoEvent(ctx)

    expect(next).toBe(original)
  })
})

// REGRESSÃO (flash medium→ultra no draft): a conversa A roda em ultra; o usuário
// abre um draft novo. O draft pinta medium (config default) e DEVE CONTINUAR medium
// quando qualquer session.info atrasado/de outra sessão chegar. Escritores de
// runtime (session-info, runtime-sync, resume) não podem tocar o esforço global do
// draft — a preferência de draft só muda por ação do usuário (manual-click) ou
// pelo seed explícito do draft-init.
describe('draft: runtime events must not rewrite the draft effort', () => {
  beforeEach(() => {
    $selectedStoredSessionId.set(null)
    setSelectedStoredSessionId(null)
    setCurrentFastMode(false)
    setCurrentServiceTier('')
    setCurrentReasoningEffort('medium', 'draft-init')
  })

  afterEach(() => {
    setSelectedStoredSessionId(null)
  })

  it('a delayed session.info from session A (ultra) does not repaint the draft', () => {
    // Draft ativo: sem sessão runtime; conversa A em background emite o evento dela.
    const ctx = sessionInfoEvent({
      activeSessionId: null,
      explicitSid: 'runtime-A',
      storedSessionId: 'stored-A',
      reasoningEffort: 'ultra',
      cwd: '/repo/A'
    })

    handleSessionInfoEvent(ctx)

    expect($draftReasoningEffort.get()).toBe('medium')
    expect($currentFastMode.get()).toBe(false)
    expect($currentServiceTier.get()).toBe('')
  })

  it('a named session.info that does not belong to the active pane cannot rewrite the composer', () => {
    setCurrentReasoningEffort('medium', 'draft-init')
    // O draft TEM runtime (usuário já digitou e session.create rodou) mas o evento
    // chegou da sessão A — sid diferente do ativo.
    const ctx = sessionInfoEvent({
      activeSessionId: 'runtime-draft',
      explicitSid: 'runtime-A',
      storedSessionId: 'stored-A',
      reasoningEffort: 'ultra'
    })

    handleSessionInfoEvent(ctx)

    expect($draftReasoningEffort.get()).toBe('medium')
  })

  it('the draft preference is not persisted by runtime events (localStorage untouched)', () => {
    setCurrentReasoningEffort('medium', 'draft-init')
    persistString('hermes.desktop.composer.reasoning-effort', 'medium')

    const ctx = sessionInfoEvent({
      activeSessionId: 'runtime-draft',
      explicitSid: 'runtime-A',
      storedSessionId: 'stored-A',
      reasoningEffort: 'ultra'
    })
    handleSessionInfoEvent(ctx)

    expect(window.localStorage.getItem('hermes.desktop.composer.reasoning-effort')).toContain('medium')
  })

  // THE Henrick scenario end-to-end (v11): draft medium → background session A
  // reports ultra → a delayed event must not flip the draft, and the persisted
  // preference must never have left medium.
  it('full ownership scenario: runtime reports never move the draft preference', () => {
    // 1-2. A draft exists with the profile-default medium.
    setCurrentReasoningEffort('medium', 'draft-init')

    // 3. Session A (a live runtime, another conversation) reports ultra.
    handleSessionInfoEvent(
      sessionInfoEvent({
        activeSessionId: 'runtime-draft',
        explicitSid: 'runtime-A',
        storedSessionId: 'stored-A',
        reasoningEffort: 'ultra',
        fast: false
      })
    )

    // 4-7. A LATE unnamed event from session A (the fan-out) lands on the draft.
    handleSessionInfoEvent(
      sessionInfoEvent({ activeSessionId: null, reasoningEffort: 'ultra', fast: true })
    )

    expect($draftReasoningEffort.get()).toBe('medium')
    expect($currentFastMode.get()).toBe(false)
    expect(window.localStorage.getItem('hermes.desktop.composer.reasoning-effort')).toContain('medium')
  })
})

// v16 — reconcile do pending model pick: transporte falhou mas o backend aplicou
// o switch; o session.info confirmatório comita composer+sticky. Runtime inativo
// só reconcilia o sticky (sem repaint). Par divergente expira sem tocar sticky.
describe('v16 pendingModelPick reconcile', () => {
  beforeEach(() => {
    setCurrentModel('cline-pass/glm-5.3-flash')
    setCurrentProvider('clinepass')
    setCurrentModelSource('manual')
    registerPendingModelPick('runtime-a', 'cline-pass/glm-5.3', 'clinepass')
  })

  afterEach(() => {
    resetPendingModelPicksForTests()
  })

  it('confirma o pending: session.info com o par esperado → atom+sticky, e limpa', () => {
    setActiveRuntimeProvider(() => 'runtime-a')

    handleSessionInfoEvent(
      sessionInfoEvent({
        activeSessionId: 'runtime-a',
        explicitSid: 'runtime-a',
        storedSessionId: 'stored-a',
        model: 'cline-pass/glm-5.3',
        provider: 'clinepass'
      })
    )

    expect($currentModel.get()).toBe('cline-pass/glm-5.3')
    expect($currentProvider.get()).toBe('clinepass')
    expect(consumePendingModelPick('runtime-a')).toBeUndefined()
  })

  it('runtime inativo: reconcilia o sticky SEM repaint do átomo do composer', () => {
    setActiveRuntimeProvider(() => 'runtime-b') // usuário já está em B

    setCurrentModel('z-ai/glm-5.3-flash') // composer de B
    setCurrentProvider('commandcode')

    handleSessionInfoEvent(
      sessionInfoEvent({
        activeSessionId: 'runtime-b',
        explicitSid: 'runtime-a', // o info é da sessão A (de trás)
        storedSessionId: 'stored-a',
        model: 'cline-pass/glm-5.3',
        provider: 'clinepass'
      })
    )

    // Composer de B intacto…
    expect($currentModel.get()).toBe('z-ai/glm-5.3-flash')
    expect($currentProvider.get()).toBe('commandcode')
    // …sticky reconciliado pro par confirmado…
    expect(consumePendingModelPick('runtime-a')).toBeUndefined()
  })

  it('par divergente: pending descartado, sticky/composer intocados', () => {
    setActiveRuntimeProvider(() => 'runtime-a')

    handleSessionInfoEvent(
      sessionInfoEvent({
        activeSessionId: 'runtime-a',
        explicitSid: 'runtime-a',
        storedSessionId: 'stored-a',
        model: 'z-ai/glm-5.3-flash',
        provider: 'commandcode'
      })
    )

    expect($currentModel.get()).toBe('cline-pass/glm-5.3-flash') // rollback natural
    expect(consumePendingModelPick('runtime-a')).toBeUndefined()
  })
})
