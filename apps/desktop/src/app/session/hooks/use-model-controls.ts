import { type QueryClient } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'

import type { ModelSelection } from '@/app/shell/model-menu-panel'
import { getGlobalModelInfo } from '@/hermes'
import { translateNow, useI18n } from '@/i18n'
import { isBusySessionModelSwitch } from '@/lib/gateway-rpc'
import { surfaceModelSwitchConfirm } from '@/lib/guarded-model-switch'
import {
  customDefaultSupersedesPick,
  manualPickRemoved,
  moaPickRemoved,
  modelOptionsQueryKey,
  requestModelOptions
} from '@/lib/model-options'
import {
  clearPendingModelPickIfSeqMatches,
  pendingModelPickSeqMatches,
  registerPendingModelPick
} from '@/lib/model-pick-pending'
import { carryReasoningEffort } from '@/lib/reasoning-effort'
import { getModelPreset } from '@/store/model-presets'
import { notifyError } from '@/store/notifications'
import { $activeGatewayProfile } from '@/store/profile'
import {
  $activeSessionId,
  $currentModel,
  $currentProvider,
  $currentReasoningEffortWire,
  $draftReasoningEffort,
  computeLastUsedSelection,
  consumeExplicitContextSwitch,
  getComposerSelectionGeneration,
  getCurrentComposerScope,
  getCurrentModelSource,
  isRefreshProtectedModel,
  markComposerSelectionManual,
  noteModelSelectionInUse,
  setCurrentModel,
  setCurrentModelSource,
  setCurrentProvider,
  setCurrentReasoningEffort,
  setCurrentReasoningEffortWire
} from '@/store/session'
import { $sessionStates, patchSessionSliceEffort, sessionTileDelegate } from '@/store/session-states'
import type { ModelOptionsResponse } from '@/types/hermes'

interface ModelControlsOptions {
  cacheOwnerConnectionId?: string
  cacheProfile?: string
  queryClient: QueryClient
  requestGateway: <T = unknown>(method: string, params?: Record<string, unknown>) => Promise<T>
}

interface ModelSwitchResponse {
  confirm_message?: string
  confirm_required?: boolean
  deferred?: boolean
}

export function useModelControls({
  cacheOwnerConnectionId,
  cacheProfile,
  queryClient,
  requestGateway
}: ModelControlsOptions) {
  const { t } = useI18n()
  const copy = t.desktop
  const profileRefreshEpochRef = useRef(0)

  // All callbacks here read reactive session state from the store (.get())
  // rather than capturing it as a prop. The actions bag in wiring.tsx mutates
  // in place to keep a stable identity, so memoized surfaces capture these
  // callbacks once and never re-evaluate — a captured prop would be stale
  // forever. The store read is always current.
  const updateModelOptionsCache = useCallback(
    (
      sessionId: null | string,
      provider: string,
      model: string,
      includeGlobal: boolean,
      profile = cacheProfile || $activeGatewayProfile.get(),
      ownerConnectionId = cacheOwnerConnectionId
    ) => {
      const patch = (prev: ModelOptionsResponse | undefined) => {
        // Selection state can update before the catalog query has resolved.
        // Keep that optimistic cache structurally complete; the composer
        // interprets a response without `providers` as an empty catalog.
        const providers = prev?.providers?.length
          ? prev.providers
          : provider && model
            ? [{ models: [model], name: provider, slug: provider }]
            : []

        return { ...prev, provider, model, providers }
      }

      queryClient.setQueryData<ModelOptionsResponse>(modelOptionsQueryKey(profile, sessionId, ownerConnectionId), patch)

      if (includeGlobal) {
        queryClient.setQueryData<ModelOptionsResponse>(modelOptionsQueryKey(profile, null, ownerConnectionId), patch)
      }
    },
    [cacheOwnerConnectionId, cacheProfile, queryClient]
  )

  // Settings → Model writes the profile default, which the backend applies to
  // new sessions only. Keep a live session's renderer state and session-scoped
  // model-options cache authoritative instead of briefly painting the saved
  // default as if the active agent had switched. Marking the composer as
  // default-derived still lets the next fresh draft reseed from profile config.
  const applySavedMainModel = useCallback(
    (provider: string, model: string) => {
      const liveSessionId = $activeSessionId.get()

      setCurrentModelSource('default')

      if (!liveSessionId) {
        setCurrentProvider(provider)
        setCurrentModel(model)
        // v14: an explicit Settings→Model pick is real use — feed the sticky.
        noteModelSelectionInUse(model, provider, getCurrentComposerScope())
      }

      // A null session id is the profile-global model-options key. Never patch
      // the live session key here: only config.set --session may change it.
      updateModelOptionsCache(null, provider, model, false)
    },
    [updateModelOptionsCache]
  )

  // Seed the composer's model state from the profile default. `force` reseeds
  // for a profile swap (the new profile has its own default); otherwise this
  // only fills an EMPTY selection so a user's pick (plain UI state in
  // $currentModel) survives the lifecycle refreshes that fire on boot / fresh
  // draft / session events. A live session owns the footer, so skip entirely.
  // Two provably-stale manual picks are the exception and reseed from the
  // profile default: the virtual `moa` provider (#90244) and a bare provider
  // slug the default has migrated to its `custom:<key>` form (#81922).
  const refreshCurrentModel = useCallback(
    async (
      force = false,
      reason: 'boot-rescope' | 'profile-switch' | 'settings-change' | 'explicit-refresh' = 'boot-rescope'
    ) => {
      // A forced profile swap opens a new intent epoch; an older in-flight
      // response for a previous profile must stand down when it resolves.
      if (force) {
        profileRefreshEpochRef.current += 1
      }

      const profileRefreshEpoch = profileRefreshEpochRef.current
      const profile = $activeGatewayProfile.get()

      try {
        if ($activeSessionId.get()) {
          return
        }

        // A manual pick stays sticky UNLESS it was provably removed from the
        // catalog, or the profile default migrated to the `custom:<key>`
        // spelling of the SAME endpoint: in both cases keeping the pick would
        // 404 every new chat or resolve the NATIVE provider and silently drop
        // the entry's `extra_body` (e.g. `thinking: {type: adaptive}`, #81922).
        // That is the ONE deliberate exception — narrower than a general
        // catalog diff: rows are hints, and a custom slug the row lacks is
        // still the user's choice (the gateway validates the id on switch).
        // Reads the model-options cache the composer already populated; an
        // unknown/not-yet-loaded catalog conservatively preserves the pick.
        const keepManualPick = () => !force && Boolean($currentModel.get()) && isRefreshProtectedModel()

        // Snapshot the selection generation before awaiting so a picker click
        // that lands while getGlobalModelInfo is in flight wins over this older
        // default — value comparisons alone miss re-selecting the same row.
        const selectionGeneration = getComposerSelectionGeneration()

        // Judge the pick against the catalog: peek the picker's own cache, so a
        // reseed can happen even before the chat view mounts its query. A
        // catalog that fails to load keeps the pick — absence of data is not
        // absence of the preset.
        const pickProvider = ($currentProvider.get() || '').trim()
        const pickModel = $currentModel.get()
        const catalogProfile = cacheProfile || profile
        const catalogKey = modelOptionsQueryKey(catalogProfile, null, cacheOwnerConnectionId)
        const catalog = queryClient.getQueryData<ModelOptionsResponse>(catalogKey) ?? null
        const isMoaPick = pickProvider.toLowerCase() === 'moa'

        // #90244: the virtual `moa` provider's row disappears entirely once no
        // preset is enabled — that one absence is authoritative, so a pick
        // pointing at it reseeds from the profile default instead of leaving
        // the pill reading `Model · moa: default` forever. The check is scoped
        // to a pick that actually names the virtual provider: `moaPickRemoved`
        // reports "the moa row is gone", which for any other provider is
        // irrelevant.
        let staleMoaPick = isMoaPick && moaPickRemoved(catalog, 'moa', pickModel)

        // #81922: a BARE slug can be the pre-migration spelling of a
        // `custom:<key>` profile default. Shipping the bare form resolves the
        // NATIVE provider and silently drops the custom entry's `extra_body`,
        // so it must yield to the configured default. Only the exact spelling
        // migration qualifies and only with a populated catalog: a pick that
        // already names a provider class is a distinct endpoint and stays
        // sticky. The profile default itself is compared after the fetch below
        // (the stale spelling migration needs the resolved default).
        let reseedSupersededPick =
          pickProvider !== '' && !pickProvider.includes(':') && catalog !== null
            ? manualPickRemoved(catalog.providers, pickProvider, pickModel)
            : false

        // The catalog cache is the only local evidence for the moa and
        // spelling-migration exceptions. When it is empty, fetch it once —
        // deduped with the in-flight UI query — so those exceptions can be
        // judged even before the chat view mounts its own query. A fetch that
        // fails leaves the pick alone: absence of data is not absence of the
        // row.
        if (catalog === null && (isMoaPick || (pickProvider !== '' && !pickProvider.includes(':')))) {
          let loadedCatalog: ModelOptionsResponse | null = null

          try {
            loadedCatalog =
              (await queryClient.fetchQuery({
                queryKey: catalogKey,
                queryFn: (): Promise<ModelOptionsResponse> =>
                  requestModelOptions({ profile: catalogProfile, request: requestGateway })
              })) ?? null
          } catch {
            loadedCatalog = null
          }

          staleMoaPick = isMoaPick && moaPickRemoved(loadedCatalog, 'moa', pickModel)
          reseedSupersededPick =
            pickProvider !== '' && !pickProvider.includes(':') && loadedCatalog !== null
              ? manualPickRemoved(loadedCatalog.providers, pickProvider, pickModel)
              : false
        }

        // A bare-slug pick may name the same endpoint the profile default now
        // spells `custom:<key>`; that comparison needs the resolved default, so
        // such a pick must NOT be kept here — it is judged after the fetch.
        const bareSlugPick = pickProvider !== '' && !pickProvider.includes(':')

        if (keepManualPick() && !staleMoaPick && !reseedSupersededPick && !bareSlugPick) {
          return
        }

        const result = await getGlobalModelInfo(profile)

        if (
          profileRefreshEpochRef.current !== profileRefreshEpoch ||
          $activeSessionId.get() ||
          getComposerSelectionGeneration() !== selectionGeneration
        ) {
          return
        }

        // The profile default is a backend fact known only after the fetch: a
        // bare-slug pick the default migrated to `custom:<key>` names the SAME
        // endpoint and must reseed (the pick's spelling is stale, not a
        // distinct choice). Compare it here so a still-current pick keeps its
        // sticky behavior.
        if (
          !staleMoaPick &&
          !reseedSupersededPick &&
          keepManualPick() &&
          !customDefaultSupersedesPick(pickProvider, result.provider ?? '')
        ) {
          return
        }

        // v14c authority: the sticky (last-used pair) survives every AUTOMATIC
        // refresh ('boot-rescope') — reconnect blips and boot reseeds must not
        // repaint a fresh draft that draft-init already resolved. Only an
        // EXPLICIT context switch ('profile-switch') or a Settings→Model change
        // ('settings-change') replaces it with the new context's default.
        // Empty sticky (first run) still seeds from the profile default.
        const lastUsed = computeLastUsedSelection()
        const stickyIsValid = Boolean(lastUsed.model && lastUsed.provider)

        const paintDefault = (model: string, provider: string) => {
          setCurrentModel(model)
          setCurrentProvider(provider)
          setCurrentModelSource('default')
        }

        if (stickyIsValid && (reason === 'boot-rescope' || reason === 'explicit-refresh') && !consumeExplicitContextSwitch()) {
          setCurrentModel(lastUsed.model)
          setCurrentProvider(lastUsed.provider)
          // v17: this is a RESTORE of the last-used pair, not a user pick —
          // provenance must say so or session.create treats it as manual.
          setCurrentModelSource('sticky_seed')

          // v20: the sticky's effort seeds the pill when the level was recorded
          // with the pair ("last used" = model + level). Presets keep winning —
          // this only fills the unpinned case, matching draft-init's order.
          if (lastUsed.effort) {
            setCurrentReasoningEffort(lastUsed.effort, 'config-seed')
          }

          return
        }

        if (typeof result.model === 'string') {
          paintDefault(result.model, typeof result.provider === 'string' ? result.provider : $currentProvider.get())
        } else if (typeof result.provider === 'string') {
          setCurrentProvider(result.provider)
        }
      } catch {
        // The delayed session.info event still updates this once the agent is ready.
      }
    },
    [cacheOwnerConnectionId, cacheProfile, queryClient]
  )

  // Carry the outgoing model's effort level onto the newly selected model:
  // switching models must move the effort pill along instead of leaving it
  // stale until the next manual effort click. `previous` must be snapshotted
  // by the caller BEFORE the optimistic selection paint clobbers the stores.
  // The source level is the surface's live level (the pill the user was
  // looking at), else the old model's remembered preset, clamped into the
  // NEW route's official vocabulary. A route with no known vocabulary carries
  // nothing — same honest fallback the effort menu itself uses (never guess
  // levels the transport may reject). Reads capabilities from the
  // model-options cache the switch just repainted; a cold cache (no
  // capabilities yet) therefore carries nothing.
  const carryEffortOver = useCallback(
    (
      liveSessionId: null | string,
      previous: { effort: string; model: string; provider: string },
      target: { model: string; provider: string }
    ) => {
      // v19b: the level VISIBLE on the pill at carry time is the authority --
      // not the pre-switch snapshot. When they differ the user (or the paint of
      // their choice) already decided; the stale snapshot must not downscale.
      // prevEffort stays as fallback for the no-session draft path.
      const visibleEffort =
        (liveSessionId ? ($sessionStates.get()[liveSessionId]?.reasoningEffort ?? '') : '') ||
        ($draftReasoningEffort.get() || '')

      const authoritativeEffort = visibleEffort || previous.effort
      previous = { ...previous, effort: authoritativeEffort }

      const catalogProviders = (
        queryClient.getQueryData<ModelOptionsResponse>(
          modelOptionsQueryKey(cacheProfile || $activeGatewayProfile.get(), liveSessionId, cacheOwnerConnectionId)
        )?.providers ?? []
      ).concat(
        queryClient.getQueryData<ModelOptionsResponse>(
          modelOptionsQueryKey(cacheProfile || $activeGatewayProfile.get(), null, cacheOwnerConnectionId)
        )?.providers ?? []
      )

      const findRow = (provider: string) =>
        catalogProviders.find(row => row.slug === provider || (row.aliases?.includes(provider) ?? false))

      // Preset rows are keyed on the CANONICAL provider slug — a session can
      // report an alias (`custom:<key>`), so resolve before keying (same rule
      // as the effort menu's resolvePresetProvider).
      const sourceEffort =
        previous.effort ||
        getModelPreset(findRow(previous.provider)?.slug || previous.provider, previous.model).effort ||
        ''

      const carried = carryReasoningEffort(
        sourceEffort,
        findRow(target.provider)?.capabilities?.[target.model]?.native_efforts ?? undefined
      )

      if (!carried) {
        return
      }

      // v12: carry is TRANSIENT intra-context state. With a live session the
      // carried level goes to THAT session's slice; on a draft it is the draft's
      // own pick (persisted as draft preference). It must NEVER mint or update
      // a remembered model preset — a historical clamp ('ultra' → 'high') used
      // to persist as if the user had pinned it and later re-seeded fresh
      // drafts through the preset branch of resolveFreshDraftEffort().
      if (liveSessionId && liveSessionId !== $activeSessionId.get()) {
        patchSessionSliceEffort(liveSessionId, carried, false)
      } else {
        setCurrentReasoningEffort(carried, 'model-carry')
      }

      if (liveSessionId) {
        void requestGateway('config.set', { key: 'reasoning', session_id: liveSessionId, value: carried }).catch(
          err => {
            notifyError(err, translateNow('shell.modelOptions.updateFailed'))
          }
        )
      }
    },
    [cacheOwnerConnectionId, cacheProfile, queryClient, requestGateway]
  )

  // Drop a sticky composer pick so new chats follow Settings → Model again,
  // without making the user re-apply the default they already have (#107410).
  const followDefaultModel = useCallback(() => {
    setCurrentModelSource('default')
    void refreshCurrentModel()
  }, [refreshCurrentModel])

  // Returns whether the switch was applied so callers can await it before
  // applying follow-up changes. `true` means applied (or deferred/busy-queued
  // for the next turn). `false` means NOT applied — either pending
  // confirmation (warning with Confirm action already shown, pill rolled back)
  // or a real failure (error toast). Callers must NOT treat `false` as a
  // generic failure: for `pending` the gateway intentionally returned
  // `confirm_required` and no error should be surfaced.
  // The composer model is plain UI state: with no live session it's just
  // stored (and shipped on the next session.create); with one it's scoped to
  // that session via config.set. It NEVER writes the profile default — that
  // lives in Settings → Model — so picking a model here can't silently mutate
  // global config.
  //
  // `selection.sessionId` targets a specific surface (tile). When omitted, the
  // primary `$activeSessionId` is used (overlay / legacy callers). A tile
  // switch must not touch the primary globals — and must not be blocked by a
  // busy primary turn.
  const selectModel = useCallback(
    async (selection: ModelSelection): Promise<boolean> => {
      const primaryRuntimeId = $activeSessionId.get()
      const liveSessionId = 'sessionId' in selection ? (selection.sessionId ?? null) : primaryRuntimeId
      const touchesPrimary = !liveSessionId || liveSessionId === primaryRuntimeId

      const prevModel = touchesPrimary ? $currentModel.get() : ($sessionStates.get()[liveSessionId!]?.model ?? '')

      const prevProvider = touchesPrimary
        ? $currentProvider.get()
        : ($sessionStates.get()[liveSessionId!]?.provider ?? '')

      const prevWire = touchesPrimary
        ? $currentReasoningEffortWire.get()
        : ($sessionStates.get()[liveSessionId!]?.reasoningEffortWire ?? '')

      const prevSource = getCurrentModelSource()
      const liveGatewayProfile = cacheProfile || $activeGatewayProfile.get()

      // Snapshot the outgoing effort level BEFORE the optimistic paint —
      // paintSelection overwrites the same atoms this reads. carryEffortOver
      // moves this level onto the new model once the switch lands.
      // v12: the outgoing level mirrors what the pill displays — the live
      // session's slice when one exists, the draft preference when the composer
      // is a draft. The slice is consulted FIRST so a session-reported level
      // wins, with the draft atom as fallback while no session.info arrived yet.
      const prevEffort =
        (liveSessionId ? ($sessionStates.get()[liveSessionId]?.reasoningEffort ?? '') : '') ||
        (touchesPrimary ? $draftReasoningEffort.get() : '')


      const paintSelection = () => {
        if (touchesPrimary) {
          setCurrentModel(selection.model)
          setCurrentProvider(selection.provider)
          markComposerSelectionManual()
        }

        // v19a: the sticky records the pair a REAL session adopted, whichever
        // surface owns it — same rule as the session.info reconciler. Under a
        // non-primary runtime the composer atoms stay untouched (no cross-
        // surface repaint), but skipping the sticky here let a promoted-draft
        // pick die with the consumed pending: the sticky kept the OLD pair and
        // the next New Session seeded from it ("pick GLM-5.3, next chat opens
        // flash"). Explicit writers stay unconditional (v18 contract).
        // v20: the pill's level travels with the pair — the next New Session
        // seeds its effort from the same sticky.
        noteModelSelectionInUse(
          selection.model,
          selection.provider,
          getCurrentComposerScope(),
          touchesPrimary ? $draftReasoningEffort.get() : ($sessionStates.get()[liveSessionId!]?.reasoningEffort ?? '')
        )

        if (liveSessionId) {
          // Every live surface renders from its per-session slice, including
          // the primary workspace pane. Updating only the sticky composer
          // atoms made the pill and the open catalog disagree until the
          // gateway's session.info confirmation arrived.
          // Optimistic tile paint — session.info will confirm; rollback on
          // error. The wire stamp belongs to the old route, so it is
          // withdrawn until session.info re-stamps it.
          sessionTileDelegate()?.updateSession(liveSessionId, state => ({
            ...state,
            model: selection.model,
            provider: selection.provider,
            reasoningEffortWire: ''
          }))
        }
      }

      const cacheSelection = (provider: string, model: string) => {
        updateModelOptionsCache(liveSessionId, provider, model, touchesPrimary && !liveSessionId, liveGatewayProfile)
      }

      const rollbackSelection = () => {
        if (touchesPrimary) {
          setCurrentModel(prevModel)
          setCurrentProvider(prevProvider)
          // The setters withdraw the wire stamp on a change; the old route's stamp is still true.
          setCurrentReasoningEffortWire(prevWire)
          setCurrentModelSource(prevSource)
        }

        if (liveSessionId) {
          sessionTileDelegate()?.updateSession(liveSessionId, state => ({
            ...state,
            model: prevModel,
            provider: prevProvider,
            reasoningEffortWire: prevWire
          }))
        }

        cacheSelection(prevProvider, prevModel)
      }

      // v15: no unconditional optimistic paint here. The draft path paints
      // right below (its create reads these atoms, and there is nothing to
      // roll back); the LIVE-session path paints only after the gateway
      // CONFIRMS the switch — an early paint leaked the picked pair into the
      // sticky even when the switch later failed, and a New Session then
      // seeded from a model the session never actually ran.
      if (!liveSessionId) {
        paintSelection()
        cacheSelection(selection.provider, selection.model)

        // No live session yet: the pick is pure UI state. session.create reads
        // $currentModel/$currentProvider and applies it as that session's override.
        return true
      }

      // The PRIMARY profile's main agent lets the gateway decide persistence
      // (resolve_persist_behavior): session-only by default, persisted when
      // model.persist_switch_by_default is true or when no default has ever
      // been configured (the first-ever pick, so resolve_provider never falls
      // through to a leftover OPENAI_API_KEY env var — #86414). A plain pick
      // no longer silently rewrites config.yaml (#90235); Settings → Model
      // remains the explicit "set as default" door.
      //
      // Two things stay --session, deliberately:
      //  - a SECONDARY chat tile: picking a model there must not rewrite the
      //    profile default (the cross-session-contamination guard).
      //  - MoA (mixture-of-agents) presets: a transient orchestration choice
      //    that must never become the persisted global gateway default.
      const isSessionOnlyPreset = (selection.provider || '').toLowerCase() === 'moa'
      const scope = touchesPrimary && !isSessionOnlyPreset ? '' : ' --session'

      const requestSwitch = (confirmExpensiveModel = false) =>
        requestGateway<ModelSwitchResponse>('config.set', {
          session_id: liveSessionId,
          key: 'model',
          value: `${selection.model} --provider ${selection.provider}${scope}`,
          ...(confirmExpensiveModel ? { confirm_expensive_model: true } : {})
        })

      const finishSwitch = (result: ModelSwitchResponse | undefined) => {
        // A pick made DURING a turn is queued by the gateway and applied at the
        // next turn start (`deferred`). Re-fetching now would answer with the
        // model still running and repaint the old name over the user's choice —
        // the switch publishes session.info when it lands, and that is what
        // re-syncs every surface.
        if (!result?.deferred) {
          void queryClient.invalidateQueries({
            queryKey: modelOptionsQueryKey(liveGatewayProfile, liveSessionId, cacheOwnerConnectionId)
          })
        }
      }

      // The switch is going through: move the outgoing effort level onto the
      // new model (carry-over). No live session → composer state only.
      const carryEffort = () =>
        carryEffortOver(
          liveSessionId,
          { effort: prevEffort, model: prevModel, provider: prevProvider },
          { model: selection.model, provider: selection.provider }
        )

      // v16: a pick whose RPC fails or hangs is PENDING, not failed — the
      // backend may still apply the switch and the authoritative session.info
      // reconciles it. Registered BEFORE the await so the hung-promise path
      // (C) is covered too.
      const pendingSeq = registerPendingModelPick(liveSessionId ?? '', selection.model, selection.provider)

      try {
        const result = await requestSwitch()

        if (result?.confirm_required) {
          rollbackSelection()
          // ONE shared applier for guarded switches (#95293): the same
          // confirm flow the Bots editor routes through — never fork this
          // logic per surface.
          surfaceModelSwitchConfirm({
            confirmMessage: result.confirm_message,
            model: selection.model,
            failureMessage: copy.modelSwitchFailed,
            finish: result => {
              finishSwitch(result)
              carryEffort()
            },
            // Staleness guard — the warning can linger while the user picks
            // a different model or switches sessions. Clicking Confirm must
            // not clobber the newer choice: bail if the live state no longer
            // matches the snapshot this notification was created for.
            isStale: () =>
              touchesPrimary
                ? $activeSessionId.get() !== liveSessionId ||
                  $currentModel.get() !== prevModel ||
                  $currentProvider.get() !== prevProvider
                : !liveSessionId ||
                  $sessionStates.get()[liveSessionId]?.model !== prevModel ||
                  $sessionStates.get()[liveSessionId]?.provider !== prevProvider,
            repaint: () => {
              paintSelection()
              cacheSelection(selection.provider, selection.model)
            },
            requestConfirmed: () => requestSwitch(true),
            rollback: rollbackSelection
          })

          return false
        }

        finishSwitch(result)
        carryEffort()
        // v16: the switch is CONFIRMED — consume the pending and paint composer
        // + sticky with the pair the user picked. Failure paths keep composer
        // and sticky untouched; the pending stays for session.info to reconcile
        // (backend applied the switch even if the response was lost).
        // v16b: seq-guard the consumption — if the user already picked AGAIN
        // (newer seq replaced this entry), a late success must not delete the
        // NEWER pick's reconciliation window.
        clearPendingModelPickIfSeqMatches(liveSessionId ?? '', pendingSeq)
        paintSelection()
        cacheSelection(selection.provider, selection.model)

        return true
      } catch (err) {
        // An OLDER gateway refuses a mid-turn switch outright (4009) instead of
        // deferring it. Don't punish the user for a backend they haven't
        // updated: keep the pick painted as the composer's selection, which is
        // what the NEXT turn runs anyway. Current gateways never take this
        // path — they answer `deferred`.
        if (isBusySessionModelSwitch(err)) {
          // The pick stays painted and runs at the next turn — the effort
          // pill must follow it now, or it would show the outgoing model's
          // level against a model that no longer uses it. The switch WAS
          // accepted (queued for next turn), so painting composer+slice here
          // is a confirmed future state, not an optimistic guess.
          paintSelection()
          cacheSelection(selection.provider, selection.model)
          carryEffort()

          return true
        }

        // v16b: a transport failure does NOT mean the switch failed — the
        // backend may have applied it (the repro: response lost, session.info
        // confirmed glm-5.3 seconds later). Keep the pending registered so the
        // reconciling session.info commits composer + sticky. Roll back the
        // OPTIMISTIC composer paint only: the pending is the durable intent.
        //
        // v16b race guard: if the session.info confirmation ALREADY consumed
        // this pick (seq mismatch) while the RPC was hanging, the confirmed
        // state is authoritative — a late timeout may NOT roll it back. Only
        // a pick whose pending is still live (nobody confirmed or replaced
        // it) rolls back. The pending itself SURVIVES the rollback: a lost
        // response does not mean the switch failed, and the reconciler may
        // still confirm it later.
        if (pendingModelPickSeqMatches(liveSessionId ?? '', pendingSeq)) {
          rollbackSelection()
          notifyError(err, copy.modelSwitchFailed)
        }

        return false
      }
    },
    [cacheOwnerConnectionId, cacheProfile, copy.modelSwitchFailed, queryClient, requestGateway, updateModelOptionsCache]
  )

  return { applySavedMainModel, followDefaultModel, refreshCurrentModel, selectModel }
}

