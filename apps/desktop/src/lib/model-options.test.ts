import { QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getGlobalModelOptions } from '@/hermes'

import {
  catalogProviderMatches,
  customDefaultSupersedesPick,
  firstSelectableCatalogModel,
  manualPickRemoved,
  modelOptionsQueryKey,
  moaPickRemoved,
  readCachedModelOptions,
  reconcileSelectionAfterCatalogRefresh,
  requestModelOptions,
  selectionInCatalog
} from './model-options'

const globalOptions = { model: 'hermes-4', provider: 'nous', providers: [] }

vi.mock('@/hermes', () => ({
  getGlobalModelOptions: vi.fn(() => Promise.resolve(globalOptions))
}))

describe('requestModelOptions', () => {
  afterEach(() => {
    vi.clearAllMocks()
    // The last-known-catalog cache persists across tests via happy-dom's
    // localStorage; a payload cached by an earlier happy-path test would
    // otherwise satisfy (and mask) a later failure-path assertion.
    localStorage.clear()
  })

  it('uses the connected gateway even before a session exists', async () => {
    const gatewayPayload = {
      model: 'BeastMode',
      provider: 'moa',
      providers: [{ models: ['BeastMode'], name: 'Mixture of Agents', slug: 'moa' }]
    }

    const gateway = {
      request: vi.fn(() => Promise.resolve(gatewayPayload))
    }

    await expect(requestModelOptions({ gateway: gateway as never, sessionId: null })).resolves.toBe(gatewayPayload)

    expect(gateway.request).toHaveBeenCalledWith('model.options', { explicit_only: true })
    expect(getGlobalModelOptions).not.toHaveBeenCalled()
  })

  it('recovers an empty gateway catalog through profile-scoped REST without replacing the session selection', async () => {
    const gatewayPayload = { model: 'hermes-local', provider: 'hermes-local' }

    const restPayload = {
      model: 'profile-default',
      provider: 'openai-codex',
      providers: [{ models: ['hermes-local'], name: 'Hermes Local vLLM', slug: 'hermes-local' }]
    }

    const gateway = {
      request: vi.fn(() => Promise.resolve(gatewayPayload))
    }

    vi.mocked(getGlobalModelOptions).mockResolvedValueOnce(restPayload)

    await expect(requestModelOptions({ gateway: gateway as never, sessionId: 'session-1' })).resolves.toEqual({
      ...restPayload,
      model: 'hermes-local',
      provider: 'hermes-local'
    })

    expect(getGlobalModelOptions).toHaveBeenCalledWith({ explicitOnly: true })
  })

  it('recovers through profile-scoped REST when the gateway catalog request fails', async () => {
    const restPayload = {
      model: 'hermes-local',
      provider: 'hermes-local',
      providers: [{ models: ['hermes-local'], name: 'Hermes Local vLLM', slug: 'hermes-local' }]
    }

    const gateway = {
      request: vi.fn(() => Promise.reject(new Error('gateway request unavailable')))
    }

    vi.mocked(getGlobalModelOptions).mockResolvedValueOnce(restPayload)

    await expect(requestModelOptions({ gateway: gateway as never, sessionId: 'session-1' })).resolves.toEqual(
      restPayload
    )
    expect(getGlobalModelOptions).toHaveBeenCalledWith({ explicitOnly: true })
  })

  it('preserves the gateway error when its REST recovery path also fails', async () => {
    const gatewayError = new Error('gateway request unavailable')

    const gateway = {
      request: vi.fn(() => Promise.reject(gatewayError))
    }

    vi.mocked(getGlobalModelOptions).mockRejectedValueOnce(new Error('REST request unavailable'))

    await expect(requestModelOptions({ gateway: gateway as never })).rejects.toBe(gatewayError)
  })

  it('keeps the gateway result when both catalog paths have no selectable models', async () => {
    const gatewayPayload = { model: 'hermes-local', provider: 'hermes-local', providers: [] }

    const gateway = {
      request: vi.fn(() => Promise.resolve(gatewayPayload))
    }

    await expect(requestModelOptions({ gateway: gateway as never })).resolves.toBe(gatewayPayload)
  })

  it('passes the active session id and refresh flag through the gateway', async () => {
    const gateway = {
      request: vi.fn(() => Promise.resolve(globalOptions))
    }

    await requestModelOptions({ gateway: gateway as never, refresh: true, sessionId: 'session-1' })

    expect(gateway.request).toHaveBeenCalledWith('model.options', {
      explicit_only: true,
      refresh: true,
      session_id: 'session-1'
    })
    expect(getGlobalModelOptions).toHaveBeenCalledWith({ explicitOnly: true, refresh: true })
  })

  it('passes the catalog owner profile through the shared gateway RPC', async () => {
    const gateway = {
      request: vi.fn(() => Promise.resolve(globalOptions))
    }

    await requestModelOptions({ gateway: gateway as never, profile: 'fred-work' })

    expect(gateway.request).toHaveBeenCalledWith('model.options', {
      explicit_only: true,
      profile: 'fred-work'
    })
  })

  it('falls back to REST when no gateway is connected', async () => {
    await requestModelOptions({ refresh: true })

    expect(getGlobalModelOptions).toHaveBeenCalledWith({ explicitOnly: true, refresh: true })
  })

  it('prefers an owner-routed request over the ambient gateway socket', async () => {
    const gatewayPayload = {
      model: 'chrome-model',
      provider: 'nous',
      providers: [{ models: ['chrome-model'], name: 'Nous', slug: 'nous' }]
    }

    const routedPayload = {
      model: 'berry-model',
      provider: 'openai',
      providers: [{ models: ['berry-model'], name: 'OpenAI', slug: 'openai' }]
    }

    const gateway = {
      request: vi.fn(() => Promise.resolve(gatewayPayload))
    }

    const request = vi.fn(() => Promise.resolve(routedPayload)) as unknown as <T>(
      method: string,
      params?: Record<string, unknown>
    ) => Promise<T>

    await expect(requestModelOptions({ gateway: gateway as never, request, sessionId: 'tile-1' })).resolves.toBe(
      routedPayload
    )

    expect(request).toHaveBeenCalledWith('model.options', { explicit_only: true, session_id: 'tile-1' })
    expect(gateway.request).not.toHaveBeenCalled()
  })

  it('does not recover an owner-routed failure through the ambient REST connection', async () => {
    const ownerError = new Error('owner gateway unavailable')
    const request = vi.fn(() => Promise.reject(ownerError))

    await expect(requestModelOptions({ profile: 'berry', request, sessionId: 'tile-1' })).rejects.toBe(ownerError)
    expect(getGlobalModelOptions).not.toHaveBeenCalled()
  })

  it('keeps an empty owner-routed catalog instead of replacing it from ambient REST', async () => {
    const ownerPayload = { model: 'berry-local', provider: 'hermes-local', providers: [] }

    const request = vi.fn(() => Promise.resolve(ownerPayload)) as unknown as <T>(
      method: string,
      params?: Record<string, unknown>
    ) => Promise<T>

    await expect(requestModelOptions({ profile: 'berry', request, sessionId: 'tile-1' })).resolves.toBe(ownerPayload)
    expect(getGlobalModelOptions).not.toHaveBeenCalled()
  })
})

describe('modelOptionsQueryKey', () => {
  it('isolates new-chat catalogs by active gateway profile', () => {
    expect(modelOptionsQueryKey('default')).not.toEqual(modelOptionsQueryKey('compass'))
  })

  it('keeps session catalogs inside the owning profile namespace', () => {
    expect(modelOptionsQueryKey(' compass ', 'session-1')).toEqual(modelOptionsQueryKey('compass', 'session-1'))
    expect(modelOptionsQueryKey('compass', 'session-1')).not.toEqual(modelOptionsQueryKey('default', 'session-1'))
  })

  it('isolates identical profile and session names across registry connections', () => {
    const sourceAKey = modelOptionsQueryKey('default', 'session-1', 'source-a')
    const sourceBKey = modelOptionsQueryKey('default', 'session-1', 'source-b')
    const queryClient = new QueryClient()

    expect(sourceAKey).not.toEqual(sourceBKey)
    queryClient.setQueryData(sourceAKey, { providers: [{ models: ['a/model'], slug: 'a' }] })
    queryClient.setQueryData(sourceBKey, { providers: [{ models: ['b/model'], slug: 'b' }] })

    expect(queryClient.getQueryData(sourceAKey)).toMatchObject({ providers: [{ models: ['a/model'] }] })
    expect(queryClient.getQueryData(sourceBKey)).toMatchObject({ providers: [{ models: ['b/model'] }] })
  })
})

describe('catalogProviderMatches', () => {
  const cloudflare = {
    aliases: ['custom:cloudflare', 'cloudflare'],
    models: ['@cf/meta/llama-3.3-70b-instruct-fp8-fast'],
    name: 'Cloudflare',
    slug: 'cloudflare'
  }

  it('matches slug, display name, and custom-provider aliases', () => {
    expect(catalogProviderMatches(cloudflare, 'cloudflare')).toBe(true)
    expect(catalogProviderMatches(cloudflare, 'Cloudflare')).toBe(true)
    expect(catalogProviderMatches(cloudflare, 'custom:cloudflare')).toBe(true)
    expect(catalogProviderMatches(cloudflare, 'openrouter')).toBe(false)
  })
})

describe('moaPickRemoved', () => {
  const providers = [
    { models: ['deepseek-v4-pro'], name: 'DeepSeek', slug: 'deepseek' },
    { models: ['default', 'balanced'], name: 'Mixture of Agents', slug: 'moa' }
  ]

  it('flags a manual moa pick when the populated catalog has no moa row (#90244)', () => {
    const noMoa = [providers[0]]
    expect(moaPickRemoved({ providers: noMoa }, 'moa', 'default')).toBe(true)
  })

  it('flags a manual moa pick whose preset the moa row no longer lists', () => {
    expect(moaPickRemoved({ providers }, 'moa', 'retired-preset')).toBe(true)
  })

  it('keeps a manual moa pick while the catalog still offers the preset', () => {
    expect(moaPickRemoved({ providers }, 'moa', 'default')).toBe(false)
    expect(moaPickRemoved({ providers }, 'MOA', 'balanced')).toBe(false)
  })

  it('never clobbers while the catalog is unavailable or loading', () => {
    expect(moaPickRemoved(undefined, 'moa', 'default')).toBe(false)
    expect(moaPickRemoved({ providers: [] }, 'moa', 'default')).toBe(false)
    expect(moaPickRemoved({ providers: undefined }, 'moa', 'default')).toBe(false)
  })

  it('leaves every non-moa provider to the sticky-pick design', () => {
    // A custom slug the catalog lacks is the user's choice, not a removal
    // (d595e636c83: picks are never retargeted from catalog membership).
    expect(moaPickRemoved({ providers: [providers[0]] }, 'deepseek', 'deepseek-v4.1-flash')).toBe(false)
    expect(moaPickRemoved({ providers: [providers[0]] }, 'custom', 'my-own-slug')).toBe(false)
    expect(moaPickRemoved({ providers: [providers[0]] }, '', 'default')).toBe(false)
  })
})

describe('customDefaultSupersedesPick', () => {
  it('flags a bare pick the default has migrated to its custom-provider form (#81922)', () => {
    // The wire payload for `nvidia` builds the NATIVE provider and drops the
    // custom entry's extra_body; `custom:nvidia` is the same endpoint.
    expect(customDefaultSupersedesPick('nvidia', 'custom:nvidia')).toBe(true)
    expect(customDefaultSupersedesPick('  NVIDIA ', 'Custom:NVIDIA')).toBe(true)
  })

  it('keeps a pick that already names the custom entry, or a different provider', () => {
    expect(customDefaultSupersedesPick('custom:nvidia', 'custom:nvidia')).toBe(false)
    expect(customDefaultSupersedesPick('custom:relay', 'custom:nvidia')).toBe(false)
    expect(customDefaultSupersedesPick('anthropic', 'custom:nvidia')).toBe(false)
  })

  it('never fires for a non-custom default or an empty pick', () => {
    expect(customDefaultSupersedesPick('nvidia', 'nvidia')).toBe(false)
    expect(customDefaultSupersedesPick('custom', 'custom')).toBe(false)
    expect(customDefaultSupersedesPick('nvidia', 'openai-codex')).toBe(false)
    expect(customDefaultSupersedesPick('', 'custom:nvidia')).toBe(false)
    expect(customDefaultSupersedesPick('nvidia', 'custom:')).toBe(false)
  })
})

describe('reconcileSelectionAfterCatalogRefresh', () => {
  const zhipu = { name: '智谱2', slug: 'zhipu', models: ['glm-4.5-air', 'glm-5-turbo'] }

  const bytea = {
    name: '字节A',
    slug: 'byteplus',
    models: ['deepseek-v4-flash', 'doubao-seed-2.0-pro']
  }

  const moa = { name: 'Mixture of Agents', slug: 'moa', models: ['default'] }

  const openrouter = {
    models: ['glm-4.5-air', 'gpt-5.5'],
    name: 'OpenRouter',
    slug: 'openrouter'
  }

  it('switches to the first new-group model when the current pick is gone', () => {
    expect(selectionInCatalog([bytea], 'glm-4.5-air', 'zhipu')).toBe(false)
    expect(firstSelectableCatalogModel([moa, bytea])).toEqual({
      model: 'deepseek-v4-flash',
      provider: 'byteplus'
    })
    expect(reconcileSelectionAfterCatalogRefresh('glm-4.5-air', [moa, bytea], 'zhipu')).toEqual({
      model: 'deepseek-v4-flash',
      provider: 'byteplus'
    })
  })

  it('keeps the current pick when it is still in the refreshed catalog', () => {
    expect(reconcileSelectionAfterCatalogRefresh('glm-4.5-air', [zhipu, moa], 'zhipu')).toBeNull()
  })

  it('keeps the current provider when the same model id exists on another provider', () => {
    expect(selectionInCatalog([openrouter, zhipu], 'glm-4.5-air', 'zhipu')).toBe(true)
    expect(selectionInCatalog([openrouter, zhipu], 'glm-4.5-air', 'openrouter')).toBe(true)
    expect(reconcileSelectionAfterCatalogRefresh('glm-4.5-air', [openrouter, zhipu], 'zhipu')).toBeNull()
  })

  it('keeps a custom provider pair when OpenRouter lists the same model id', () => {
    const model = '@cf/meta/llama-3.3-70b-instruct-fp8-fast'

    const cloudflare = {
      aliases: ['custom:cloudflare', 'cloudflare'],
      models: [model],
      name: 'Cloudflare',
      slug: 'cloudflare'
    }

    const openrouterCf = { models: [model, 'gpt-5.5'], name: 'OpenRouter', slug: 'openrouter' }

    expect(selectionInCatalog([openrouterCf, cloudflare], model, 'custom:cloudflare')).toBe(true)
    expect(reconcileSelectionAfterCatalogRefresh(model, [openrouterCf, cloudflare], 'custom:cloudflare')).toBeNull()
  })

  it('does not jump to OpenRouter when the current provider is missing but still lists the same model id', () => {
    expect(reconcileSelectionAfterCatalogRefresh('glm-4.5-air', [openrouter, moa], 'zhipu')).toBeNull()
  })

  it('keeps the pick when the current provider is present but unconfigured', () => {
    const emptyZhipu = { models: [], name: '智谱2', slug: 'zhipu' }

    expect(reconcileSelectionAfterCatalogRefresh('glm-4.5-air', [emptyZhipu, openrouter], 'zhipu')).toBeNull()
  })

  it('falls back when the current provider is populated and dropped the model', () => {
    const zhipuWithoutAir = { models: ['glm-5-turbo'], name: '智谱2', slug: 'zhipu' }

    expect(reconcileSelectionAfterCatalogRefresh('glm-4.5-air', [zhipuWithoutAir, openrouter], 'zhipu')).toEqual({
      model: 'glm-5-turbo',
      provider: 'zhipu'
    })
  })

  it('does not wipe the pick when the refreshed catalog has no selectable models', () => {
    expect(reconcileSelectionAfterCatalogRefresh('glm-4.5-air', [moa], 'zhipu')).toBeNull()
    expect(reconcileSelectionAfterCatalogRefresh('glm-4.5-air', [], 'zhipu')).toBeNull()
    expect(reconcileSelectionAfterCatalogRefresh('glm-4.5-air', undefined, 'zhipu')).toBeNull()
  })
})

describe('last-known catalog cache', () => {
  afterEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('persists a good catalog and serves it when the live fetch fails', async () => {
    const goodPayload = {
      model: 'BeastMode',
      provider: 'moa',
      providers: [{ models: ['BeastMode'], name: 'Mixture of Agents', slug: 'moa' }]
    }

    const gateway = { request: vi.fn(() => Promise.resolve(goodPayload)) }

    await requestModelOptions({ gateway: gateway as never, sessionId: null })

    const failingGateway = { request: vi.fn(() => Promise.reject(new Error('gateway gone'))) }

    await expect(requestModelOptions({ gateway: failingGateway as never, sessionId: null })).resolves.toEqual(
      goodPayload
    )
  })

  it('never caches a catalog without selectable models', async () => {
    const gateway = { request: vi.fn(() => Promise.resolve({ model: 'x', provider: 'y', providers: [] })) }

    await requestModelOptions({ gateway: gateway as never })

    expect(readCachedModelOptions()).toBeNull()

    const failingGateway = { request: vi.fn(() => Promise.reject(new Error('gateway gone'))) }

    await expect(requestModelOptions({ gateway: failingGateway as never })).rejects.toBeTruthy()
  })

  it('keeps an empty live catalog when nothing is cached (credential-group semantics)', async () => {
    const gatewayPayload = { model: 'hermes-local', provider: 'hermes-local', providers: [] }
    const gateway = { request: vi.fn(() => Promise.resolve(gatewayPayload)) }

    await expect(requestModelOptions({ gateway: gateway as never })).resolves.toBe(gatewayPayload)
  })

  it('ignores the stale cache when the refresh is explicit', async () => {
    const goodPayload = {
      model: 'BeastMode',
      provider: 'moa',
      providers: [{ models: ['BeastMode'], name: 'Mixture of Agents', slug: 'moa' }]
    }

    await requestModelOptions({ gateway: { request: vi.fn(() => Promise.resolve(goodPayload)) } as never })

    const failingGateway = { request: vi.fn(() => Promise.reject(new Error('gateway gone'))) }

    await expect(requestModelOptions({ gateway: failingGateway as never, refresh: true })).rejects.toBeTruthy()
  })

  it('drops cache entries past the TTL', () => {
    const entry = {
      at: Date.now() - 25 * 60 * 60 * 1000,
      data: {
        model: 'BeastMode',
        provider: 'moa',
        providers: [{ models: ['BeastMode'], name: 'Mixture of Agents', slug: 'moa' }]
      }
    }

    localStorage.setItem('hermes:model-options-cache:v1', JSON.stringify({ explicit: entry }))

    expect(readCachedModelOptions()).toBeNull()
  })
})
