// @vitest-environment jsdom
import { cleanup, render, waitFor } from '@testing-library/react'
import type * as ReactRouterDom from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { sessionRoute } from '@/app/routes'
import type * as HermesApi from '@/hermes'
import type * as ChatMessages from '@/lib/chat-messages'
import { $messages, setMessages, setSelectedStoredSessionId } from '@/store/session'

import { adoptPrimedTranscript, primeRouteTranscript, useRouteTranscriptPaint } from './route-transcript-paint'

const pathnameRef = { current: sessionRoute('session-a') }

vi.mock('react-router', async importOriginal => ({
  ...(await importOriginal<typeof ReactRouterDom>()),
  useLocation: () => ({ pathname: pathnameRef.current })
}))

vi.mock('@/hermes', async importOriginal => ({
  ...(await importOriginal<typeof HermesApi>()),
  getLatestSessionMessages: vi.fn()
}))

vi.mock('@/lib/chat-messages', async importOriginal => ({
  ...(await importOriginal<typeof ChatMessages>()),
  toChatMessages: (rows: { id: number; role: string }[]) =>
    rows.map(row => ({ id: String(row.id), parts: [], role: row.role }))
}))

import { getLatestSessionMessages } from '@/hermes'

const readTail = vi.mocked(getLatestSessionMessages)

const page = (count: number) =>
  ({
    messages: Array.from({ length: count }, (_, index) => ({ id: index + 1, role: index % 2 ? 'user' : 'assistant' })),
    pagination: {},
    profile: 'default',
    session_id: 'session-a'
  }) as never

function Harness({
  enabled,
  routedSessionId,
  transcriptEmpty = true
}: {
  enabled: boolean
  routedSessionId: null | string
  transcriptEmpty?: boolean
}) {
  useRouteTranscriptPaint({ enabled, routedSessionId, transcriptEmpty })

  return null
}

describe('useRouteTranscriptPaint', () => {
  beforeEach(() => {
    readTail.mockReset()
    setMessages([])
    setSelectedStoredSessionId('session-a')
    pathnameRef.current = sessionRoute('session-a')
  })

  afterEach(() => {
    cleanup()
    setMessages([])
    setSelectedStoredSessionId(null)
    vi.clearAllMocks()
  })

  it('paints the stored transcript before the attach answers', async () => {
    let resolveRead: (value: unknown) => void = () => undefined
    readTail.mockReturnValue(new Promise(resolve => (resolveRead = resolve)) as never)

    render(<Harness enabled routedSessionId="session-a" />)

    expect(readTail.mock.calls[0]?.[0]).toBe('session-a')
    expect($messages.get()).toHaveLength(0)

    resolveRead(page(3))

    await waitFor(() => expect($messages.get()).toHaveLength(3))
  })

  it('never overwrites a transcript the resume painted first', async () => {
    let resolveRead: (value: unknown) => void = () => undefined
    readTail.mockReturnValue(new Promise(resolve => (resolveRead = resolve)) as never)

    render(<Harness enabled routedSessionId="session-a" />)

    setMessages([{ id: 'resume-row', parts: [], role: 'user' }])
    resolveRead(page(2))

    await waitFor(() => expect(readTail).toHaveBeenCalledTimes(1))
    await Promise.resolve()

    expect($messages.get()).toHaveLength(1)
    expect($messages.get()[0].id).toBe('resume-row')
  })

  it('drops a page whose click was abandoned (selection moved)', async () => {
    let resolveRead: (value: unknown) => void = () => undefined
    readTail.mockReturnValue(new Promise(resolve => (resolveRead = resolve)) as never)

    render(<Harness enabled routedSessionId="session-a" />)

    setSelectedStoredSessionId('session-b')
    resolveRead(page(2))

    await waitFor(() => expect(readTail).toHaveBeenCalledTimes(1))
    await Promise.resolve()

    expect($messages.get()).toHaveLength(0)
  })

  it('stays out of tiles, new-chat routes, and a transcript that is already painted', () => {
    render(<Harness enabled={false} routedSessionId="session-a" />)
    render(<Harness enabled routedSessionId={null} />)
    render(<Harness enabled routedSessionId="session-a" transcriptEmpty={false} />)

    expect(readTail).not.toHaveBeenCalled()
  })

  it('shares one read with the resume that follows the click', async () => {
    const scope = { connectionId: 'local', profile: 'default' }
    const read = primeRouteTranscript('session-a', scope)
    const adopted = adoptPrimedTranscript('session-a', scope)

    expect(adopted).toBe(read)
    expect(adoptPrimedTranscript('session-a', scope)).toBeNull()
    await read.catch(() => undefined)
  })

  it('refuses to hand the resume a read primed for another owner', async () => {
    const read = primeRouteTranscript('session-a', { connectionId: 'local', profile: 'work' })

    expect(adoptPrimedTranscript('session-a', { connectionId: 'local', profile: 'default' })).toBeNull()
    await read.catch(() => undefined)
  })
})
