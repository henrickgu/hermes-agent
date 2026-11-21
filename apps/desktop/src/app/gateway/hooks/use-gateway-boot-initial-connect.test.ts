import { GatewayReauthRequiredError } from '@hermes/shared'
import { describe, expect, it, vi } from 'vitest'

import { connectInitialGateway } from './use-gateway-boot'

const never = () => false
const resolveUrl = async () => 'ws://127.0.0.1:1234/api/ws'

describe('connectInitialGateway (initial-boot dial retry, #49645)', () => {
  it('retries past transient transport failures and resolves once a connect succeeds', async () => {
    const connect = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error('WebSocket connection closed (1006)'))
      .mockRejectedValueOnce(new Error('connect ECONNREFUSED'))
      .mockResolvedValueOnce(undefined)

    await expect(connectInitialGateway({ connect, resolveUrl, delayMs: 0, isCancelled: never })).resolves.toBeUndefined()
    expect(connect).toHaveBeenCalledTimes(3)
  })

  it('mints again when the first local gateway ticket times out', async () => {
    const resolveUrl = vi.fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('Timed out minting the gateway WebSocket URL'))
      .mockResolvedValueOnce('ws://127.0.0.1:1234/api/ws')
    const connect = vi.fn<(url: string) => Promise<void>>().mockResolvedValue(undefined)

    await connectInitialGateway({ connect, resolveUrl, delayMs: 0, isCancelled: never })

    expect(resolveUrl).toHaveBeenCalledTimes(2)
    expect(connect).toHaveBeenCalledExactlyOnceWith('ws://127.0.0.1:1234/api/ws')
  })

  it('throws the last error after exhausting all attempts', async () => {
    const connect = vi.fn<() => Promise<void>>().mockRejectedValue(new Error('backend cold'))

    await expect(connectInitialGateway({ attempts: 3, connect, resolveUrl, delayMs: 0, isCancelled: never })).rejects.toThrow(
      'backend cold'
    )
    expect(connect).toHaveBeenCalledTimes(3)
  })

  it('fails fast on reauth errors without retrying', async () => {
    const connect = vi.fn<() => Promise<void>>().mockRejectedValue(new GatewayReauthRequiredError('sign in again'))

    await expect(connectInitialGateway({ connect, resolveUrl, delayMs: 0, isCancelled: never })).rejects.toBeInstanceOf(
      GatewayReauthRequiredError
    )
    expect(connect).toHaveBeenCalledTimes(1)
  })

  it('stops retrying once cancelled (component unmounted)', async () => {
    let cancelled = false

    const connect = vi.fn<() => Promise<void>>().mockImplementation(() => {
      cancelled = true

      return Promise.reject(new Error('connect ECONNREFUSED'))
    })

    await expect(connectInitialGateway({ connect, resolveUrl, delayMs: 0, isCancelled: () => cancelled })).rejects.toThrow(
      'connect ECONNREFUSED'
    )
    expect(connect).toHaveBeenCalledTimes(1)
  })
})
