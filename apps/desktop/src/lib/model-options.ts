import type { ModelCapabilities, ModelOptionProvider, ModelOptionsResult } from '@hermes/shared'

import { getGlobalModelOptions, type HermesGateway } from '@/hermes'

/** Compat: a leva custom chamava o contrato de `ModelOptionsResponse`;
 *  o upstream o gerou como `ModelOptionsResult` no contrato compartilhado. */
export type ModelOptionsResponse = ModelOptionsResult

type CatalogProviderIdentity = Pick<ModelOptionProvider, 'aliases' | 'name' | 'slug'>

/** True when `currentProvider` is this catalog row — slug, display name, or
 *  a custom-provider alias (`custom:<key>` vs the bare config key, #87035). */
export function catalogProviderMatches(provider: CatalogProviderIdentity, currentProvider: string): boolean {
  if (!currentProvider) {
    return false
  }

  return (
    provider.slug === currentProvider ||
    provider.name === currentProvider ||
    (provider.aliases?.includes(currentProvider) ?? false)
  )
}

/** The catalog row for `currentProvider`, matched the same way as
 *  `catalogProviderMatches` (so a saved `custom:<key>` finds its row). */
export function findCatalogProvider<T extends CatalogProviderIdentity>(
  providers: readonly T[] | undefined,
  currentProvider: string
): T | undefined {
  if (!providers?.length || !currentProvider) {
    return undefined
  }

  return providers.find(row => catalogProviderMatches(row, currentProvider))
}

function catalogHasModel(providers: ModelOptionProvider[] | undefined, model: string): boolean {
  return Boolean(model) && (providers?.some(provider => (provider.models ?? []).includes(model)) ?? false)
}

/**
 * True only when a persisted **manual** composer pick has been removed from the
 * catalog (its provider still ships models, but no longer this one) — so a new
 * chat would keep 404'ing the dead model. Deliberately conservative to never
 * clobber a still-valid pick: an unknown/absent provider, an empty model list
 * (re-auth / unconfigured), or a not-yet-loaded catalog all return false.
 */
export function manualPickRemoved(
  providers: ModelOptionProvider[] | undefined,
  provider: string,
  model: string
): boolean {
  if (!providers?.length || !provider || !model) {
    return false
  }

  const row = findCatalogProvider(providers, provider)

  if (!row) {
    return false
  }

  const models = row.models ?? []

  // Empty list means the provider is present but unconfigured / awaiting
  // re-auth, not that the model was dropped — leave the pick alone.
  if (models.length === 0) {
    return false
  }

  return !models.includes(model)
}

const MOA_PROVIDER_SLUG = 'moa'

/** True when THIS provider still lists `model`. Identity is the (provider,
 *  model) pair: the same id on OpenRouter does not count as the custom /
 *  first-party pick still being offered. */
export function selectionInCatalog(
  providers: ModelOptionProvider[] | undefined,
  model: string,
  provider?: string
): boolean {
  if (!providers?.length || !model || !provider) {
    return false
  }

  const row = findCatalogProvider(providers, provider)

  return Boolean(row && (row.models ?? []).includes(model))
}

/** First real (non-MoA) catalog row that still has models. */
export function firstSelectableCatalogModel(
  providers: ModelOptionProvider[] | undefined
): { model: string; provider: string } | null {
  if (!providers?.length) {
    return null
  }

  for (const provider of providers) {
    if (provider.slug === MOA_PROVIDER_SLUG) {
      continue
    }

    const model = provider.models?.[0]

    if (model) {
      return { model, provider: provider.slug }
    }
  }

  return null
}

/**
 * After Refresh Models replaces the catalog: keep the current **pair** when
 * that provider still lists the model. Never rewrite the provider just because
 * another catalog row (OpenRouter, …) exposes the same model id.
 *
 * Conservative like `manualPickRemoved` when the current provider is absent or
 * unconfigured (empty models) — except a fully gone model (group / credential
 * swap that dropped the id everywhere) still falls back to the first
 * selectable row. Returns null when the catalog is empty/unloaded so we never
 * wipe a selection on a failed or still-hydrating refresh.
 */
export function reconcileSelectionAfterCatalogRefresh(
  currentModel: string,
  providers: ModelOptionProvider[] | undefined,
  currentProvider?: string
): { model: string; provider: string } | null {
  const next = firstSelectableCatalogModel(providers)

  if (!next) {
    return null
  }

  if (!currentModel) {
    return next
  }

  if (currentProvider) {
    if (selectionInCatalog(providers, currentModel, currentProvider)) {
      return null
    }

    const row = findCatalogProvider(providers, currentProvider)

    // Present but empty: re-auth / unconfigured, not "model dropped".
    if (row && (row.models ?? []).length === 0) {
      return null
    }

    // This provider still ships models and dropped this one — fall back.
    if (row) {
      return next
    }

    // Provider missing from the refreshed catalog. Another provider listing
    // the same id is NOT a reason to switch (the OpenRouter collision).
    if (catalogHasModel(providers, currentModel)) {
      return null
    }

    return next
  }

  // No provider on the current pair: keep when the id is still offered
  // anywhere, otherwise fall back. Callers that know the provider must pass it
  // so a shared id cannot retarget the pick.
  if (catalogHasModel(providers, currentModel)) {
    return null
  }

  return next
}

interface ModelOptionsRequest {
  /** When false, include ambient/unconfigured providers (onboarding/setup
   *  surfaces). Chat pickers default to true so only explicitly configured
   *  providers are listed (#56974). */
  explicitOnly?: boolean
  gateway?: HermesGateway
  /** Owner-routed RPC. When set, catalog reads hit this dispatcher instead of
   *  `gateway.request` — a tile's model menu must not query the ambient
   *  chrome socket (#93892). */
  request?: <T>(method: string, params?: Record<string, unknown>) => Promise<T>
  /** Profile for the REST recovery path. Must match the catalog owner so a
   *  secondary tile does not fall back to the launch profile's models. */
  profile?: null | string
  /** The owner connection the catalog belongs to — the same dimension
   *  `modelOptionsQueryKey` uses. Scopes the localStorage fallback cache so
   *  one backend's catalog never serves as another's stale fallback. */
  ownerConnectionId?: null | string
  refresh?: boolean
  sessionId?: null | string
}


/** The catalog's option support for the current pick, or undefined while the
 *  catalog is loading / doesn't say. Callers treat undefined as "assume
 *  reasoning" so controls never flicker away during the fetch. */
export function currentModelCapabilities(
  options: ModelOptionsResult | null | undefined,
  provider: string,
  model: string
): ModelCapabilities | undefined {
  return findCatalogProvider(options?.providers ?? [], provider)?.capabilities?.[model]
}

// A picked (provider, model) pair is never retargeted from catalog membership.
// Picker rows are hints (discovered / curated / capped lists); a custom endpoint
// or a newer release legitimately serves ids the row lacks, and the backend
// soft-accepts them. Diffing the pick against the catalog silently swapped
// `deepseek-v4.1-flash` for the row's `-0731` sibling. The only authority on a
// pick's validity is the gateway's switch result.

/** The single, deliberate exception to the sticky-pick rule above: the virtual
 *  `moa` provider. Its catalog row vanishes entirely once no MoA preset is
 *  enabled (`hermes_cli/inventory.py` filters it out of explicit-only
 *  catalogs), so a persisted manual pick pointing at it leaves the composer
 *  pill reading `Model · moa: default` forever (#90244). For this one provider
 *  — and only with a populated catalog in hand — row absence is authoritative:
 *  the pick reseeds from the profile default. Every other provider keeps the
 *  sticky behavior; an unloaded/empty catalog never clobbers anything. */
export function moaPickRemoved(
  options: { providers?: ModelOptionProvider[] | null } | null | undefined,
  provider: string,
  model: string
): boolean {
  if (!model.trim() || provider.trim().toLowerCase() !== 'moa') {
    return false
  }

  const providers = options?.providers

  if (!providers || providers.length === 0) {
    return false
  }

  const row = providers.find(p => (p.slug || p.name || '').toLowerCase() === 'moa')

  return !(row?.models ?? []).includes(model)
}

/** A bare provider slug is the pre-migration spelling of a custom entry. The
 *  catalog aliases `custom:<key>` with the bare config key (#87035), so a pick
 *  still carrying `nvidia` and a profile default of `custom:nvidia` name the
 *  SAME endpoint — the pick's spelling is simply stale, not a distinct choice.
 *  Shipping the bare slug resolves the NATIVE provider instead of the custom
 *  entry, silently dropping the entry's `extra_body` (e.g.
 *  `thinking: {type: adaptive}`) that the user configured (#81922).
 *
 *  Only a bare slug can be superseded: a pick that already names a provider
 *  class (`custom:<other>`, `moa`, `openai-codex`) is a different endpoint and
 *  keeps the sticky behavior. The bare slug must be the default's own key, so
 *  an unrelated manual pick (`anthropic` while the default is `custom:nvidia`)
 *  is never clobbered. */
export function customDefaultSupersedesPick(pickProvider: string, defaultProvider: string): boolean {
  const pick = (pickProvider || '').trim().toLowerCase()
  const fallback = (defaultProvider || '').trim().toLowerCase()

  if (!pick || pick === fallback || !fallback.startsWith('custom:')) {
    return false
  }

  const key = fallback.slice('custom:'.length).trim()

  return key.length > 0 && pick === key
}

export function modelOptionsQueryKey(
  profile: null | string | undefined,
  sessionId?: null | string,
  ownerConnectionId?: null | string
) {
  const profileKey = (profile ?? '').trim() || 'default'
  const ownerKey = (ownerConnectionId ?? '').trim()

  return ['model-options', profileKey, sessionId || 'global', ...(ownerKey ? ['owner', ownerKey] : [])] as const
}

function hasSelectableModels(options: ModelOptionsResult | null | undefined): boolean {
  return options?.providers?.some(provider => (provider.models?.length ?? 0) > 0) ?? false
}

// ─── Last-known catalog cache (localStorage) ────────────────────────────────
// Building the catalog costs seconds on the backend (lazy imports + provider
// probes on the first call after gateway start). Persisting the last good
// payload lets any picker paint the known list instantly and revalidate in the
// background instead of spinning from zero. Best-effort by design: a missing,
// corrupt, or quota-frozen localStorage just means the old cold-open behavior.

const CATALOG_CACHE_KEY = 'hermes:model-options-cache:v1'
const CATALOG_CACHE_TTL_MS = 24 * 60 * 60 * 1000

interface CatalogCacheEntry {
  at: number
  data: ModelOptionsResponse
}

/** The cache slot a catalog belongs to. Scoped by profile AND owner
 *  connection — the same dimensions as `modelOptionsQueryKey` — because
 *  profile names are not unique across sources and a single bare
 *  'explicit'/'full' slot let one backend's catalog serve as another's
 *  fallback (the exact cross-contamination the REST recovery path refuses
 *  to do). The unsuffixed legacy slot is read once for continuity, then
 *  never written again. */
function catalogCacheSlot(explicitOnly: boolean, profile?: null | string, ownerConnectionId?: null | string): string {
  const profileKey = (profile ?? '').trim() || 'default'
  const ownerKey = (ownerConnectionId ?? '').trim()

  return explicitOnly
    ? `explicit.${profileKey}${ownerKey ? `@${ownerKey}` : ''}`
    : `full.${profileKey}${ownerKey ? `@${ownerKey}` : ''}`
}

/** The slot name used before per-profile scoping — still readable (one
 *  migration read) so the first open after the update keeps its instant
 *  paint instead of starting cold. */
function legacyCatalogCacheSlot(explicitOnly: boolean): 'explicit' | 'full' {
  return explicitOnly ? 'explicit' : 'full'
}

function readCatalogStore(): Record<string, CatalogCacheEntry> {
  try {
    const raw = localStorage.getItem(CATALOG_CACHE_KEY)

    return raw ? (JSON.parse(raw) as Record<string, CatalogCacheEntry>) : {}
  } catch {
    return {}
  }
}

/** Last good catalog for `explicitOnly`, when fresh enough to serve. */
export function readCachedModelOptions(
  explicitOnly = true,
  profile?: null | string,
  ownerConnectionId?: null | string
): ModelOptionsResponse | null {
  try {
    const store = readCatalogStore()

    const entry =
      store[catalogCacheSlot(explicitOnly, profile, ownerConnectionId)] ??
      store[legacyCatalogCacheSlot(explicitOnly)]

    if (!entry?.data || Date.now() - entry.at > CATALOG_CACHE_TTL_MS) {
      return null
    }

    if (!hasSelectableModels(entry.data)) {
      return null
    }

    return entry.data
  } catch {
    return null
  }
}

function cacheModelOptions(
  explicitOnly: boolean,
  data: ModelOptionsResponse,
  profile?: null | string,
  ownerConnectionId?: null | string
): void {
  // Never pin an empty/broken catalog: it would defeat the selective
  // recovery path in requestModelOptions and placeholder a picker with
  // nothing selectable.
  if (!hasSelectableModels(data)) {
    return
  }

  try {
    const store = readCatalogStore()

    store[catalogCacheSlot(explicitOnly, profile, ownerConnectionId)] = { at: Date.now(), data }
    localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(store))
  } catch {
    // Quota / serialization — cache is best-effort.
  }
}

function restModelOptions(
  explicitOnly: boolean,
  refresh: boolean,
  profile?: null | string
): Promise<ModelOptionsResult> {
  const opts = { explicitOnly, ...(refresh ? { refresh: true } : {}) }
  const profileKey = (profile ?? '').trim()

  return profileKey ? getGlobalModelOptions(opts, profileKey) : getGlobalModelOptions(opts)
}

async function fetchModelOptions({
  explicitOnly = true,
  gateway,
  profile,
  refresh = false,
  request,
  sessionId
}: ModelOptionsRequest): Promise<ModelOptionsResult> {
  const dispatch = request ?? (gateway ? gateway.request.bind(gateway) : null)

  if (dispatch) {
    const params: Record<string, unknown> = {}

    if (sessionId) {
      params.session_id = sessionId
    }

    if (refresh) {
      params.refresh = true
    }

    if (explicitOnly) {
      params.explicit_only = true
    }

    const profileKey = (profile ?? '').trim()

    if (profileKey) {
      params.profile = profileKey
    }

    let gatewayError: unknown
    let gatewayOptions: ModelOptionsResult | undefined

    try {
      gatewayOptions = await dispatch<ModelOptionsResult>('model.options', params)
    } catch (error) {
      gatewayError = error
    }

    if (gatewayOptions && hasSelectableModels(gatewayOptions)) {
      return gatewayOptions
    }

    // An owner-routed dispatcher can name a different registry connection than
    // the ambient REST client. Never recover that request through ambient REST:
    // profile names are not unique across sources, so doing so can cache B's
    // catalog under A's tile. Ambient gateway requests retain the compatibility
    // recovery used by older backends with incomplete model.options responses.
    if (!request) {
      try {
        const restOptions = await restModelOptions(explicitOnly, refresh, profile)

        if (hasSelectableModels(restOptions)) {
          return {
            ...restOptions,
            ...(gatewayOptions?.provider ? { provider: gatewayOptions.provider } : {}),
            ...(gatewayOptions?.model ? { model: gatewayOptions.model } : {})
          }
        }
      } catch {
        // Preserve the gateway result (or its original error) when the recovery
        // path is unavailable.
      }
    }

    if (gatewayOptions) {
      return gatewayOptions
    }

    throw gatewayError
  }

  const restOnly = await restModelOptions(explicitOnly, refresh, profile)

  return restOnly
}

/**
 * Fetch the catalog, falling back to the last known good one (localStorage)
 * when the live fetch FAILS or yields nothing selectable. The persisted cache
 * lets the picker paint instantly across app restarts even while the backend
 * is still paying its cold-start cost. Semantics preserved from the inner
 * fetch: a deliberately empty catalog (credential group swap) is still
 * returned as-is when there is no cached alternative, and an explicit
 * `refresh: true` never masks a failed refresh with stale data.
 */
export async function requestModelOptions(
  req: ModelOptionsRequest
): Promise<ModelOptionsResponse> {
  const explicitOnly = req.explicitOnly ?? true
  const cacheFallbackAllowed = !req.refresh
  let live: ModelOptionsResponse | undefined

  try {
    live = await fetchModelOptions(req)
  } catch (err) {
    const cached = cacheFallbackAllowed
      ? readCachedModelOptions(explicitOnly, req.profile, req.ownerConnectionId)
      : null

    if (cached) {
      return cached
    }

    throw err
  }

  if (hasSelectableModels(live)) {
    cacheModelOptions(explicitOnly, live, req.profile, req.ownerConnectionId)

    return live
  }

  const cached = cacheFallbackAllowed
    ? readCachedModelOptions(explicitOnly, req.profile, req.ownerConnectionId)
    : null

  if (cached) {
    return cached
  }

  return live
}
