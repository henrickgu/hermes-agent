import { describe, expect, it } from 'vitest'

import { type ChatMessage, chatMessageText, toChatMessages } from '@/lib/chat-messages'
import type { SessionMessage } from '@/types/hermes'

import { graftRefreshedTailOntoBackfill } from './transcript-backfill'

/**
 * A tail refresh that lands inside a running tool turn used to append the live
 * window's copy of that turn below the refreshed page, because the optimistic
 * prompt only receives its stored row id when the turn's completion receipt
 * arrives. state.db held one turn while the screen painted the prompt twice.
 */

const call = (id: string) => [{ id, type: 'function' as const, function: { name: 'terminal', arguments: '{}' } }]

const rows: SessionMessage[] = [
  { id: 100, role: 'user', content: 'previous prompt', timestamp: 100 },
  { id: 101, role: 'assistant', content: 'previous answer', timestamp: 101 },
  { id: 102, role: 'user', content: 'Hermes, vamos seguir com a correção.', timestamp: 102 },
  { id: 103, role: 'assistant', content: '', tool_calls: call('call_a'), timestamp: 103 },
  { id: 104, role: 'tool', content: 'ok', tool_call_id: 'call_a', tool_name: 'terminal', timestamp: 104 },
  { id: 105, role: 'assistant', content: '', tool_calls: call('call_b'), timestamp: 105 }
]

/** The page starts on the turn before the live one; the window starts after it. */
const page = (tail: SessionMessage[] = []) => toChatMessages([...rows, ...tail])

const liveCall = (callId: string): ChatMessage['parts'][number] => ({
  type: 'tool-call',
  toolName: 'terminal',
  args: {},
  toolCallId: callId,
  timestamp: 500
})

/** Window as the stream leaves it: unbound prompt plus the tool bubbles it streamed. */
const windowWithLiveTurn = (extra: ChatMessage[] = []): ChatMessage[] => [
  ...toChatMessages([rows[1]]),
  {
    id: 'user-submission-1',
    role: 'user',
    parts: [{ type: 'text', text: 'Hermes, vamos seguir com a correção.' }],
    pending: true
  },
  {
    id: 'assistant-stream-1',
    role: 'assistant',
    parts: [liveCall('call_a'), liveCall('call_b')],
    pending: true
  },
  ...extra
]

const texts = (messages: ChatMessage[]) => messages.map(chatMessageText)

const toolIds = (messages: ChatMessage[]) =>
  messages.flatMap(message =>
    message.parts.flatMap(part => (part.type === 'tool-call' ? [part.toolCallId] : []))
  )

describe('tail refresh over a still-running turn', () => {
  it('draws the prompt and its tool rows once when the page holds the same turn', () => {
    const merged = graftRefreshedTailOntoBackfill(page(), windowWithLiveTurn())

    expect(texts(merged).filter(text => text === 'Hermes, vamos seguir com a correção.')).toHaveLength(1)
    expect(toolIds(merged).sort()).toEqual(['call_a', 'call_b'])
  })

  it('keeps a live tool bubble the page does not carry yet', () => {
    const merged = graftRefreshedTailOntoBackfill(
      page(),
      windowWithLiveTurn([
        {
          id: 'assistant-stream-2',
          role: 'assistant',
          parts: [liveCall('call_c')],
          pending: true
        }
      ])
    )

    expect(toolIds(merged)).toContain('call_c')
    expect(texts(merged).filter(text => text === 'Hermes, vamos seguir com a correção.')).toHaveLength(1)
  })

  it('keeps a new turn that repeats the prompt with different tool calls', () => {
    const merged = graftRefreshedTailOntoBackfill(page(), [
      ...toChatMessages([rows[1]]),
      {
        id: 'user-submission-2',
        role: 'user',
        parts: [{ type: 'text', text: 'Hermes, vamos seguir com a correção.' }],
        pending: true
      },
      {
        id: 'assistant-stream-2',
        role: 'assistant',
        parts: [liveCall('call_x')],
        pending: true
      }
    ])

    expect(texts(merged).filter(text => text === 'Hermes, vamos seguir com a correção.')).toHaveLength(2)
  })

  it('draws the prompt once when the page ends at it and the turn has no tool rows yet', () => {
    // Re-reading the running session (switch back) returns a page that ends at
    // the prompt: the turn has not flushed any tool row. The page also starts
    // above the window's first row, so the overlap merge runs.
    const pageEndingAtThePrompt = toChatMessages([
      { id: 90, role: 'assistant', content: 'older context', timestamp: 90 },
      rows[0],
      rows[1],
      rows[2]
    ])

    const merged = graftRefreshedTailOntoBackfill(pageEndingAtThePrompt, [
      ...toChatMessages([rows[1]]),
      {
        id: 'user-submission-1',
        role: 'user',
        parts: [{ type: 'text', text: 'Hermes, vamos seguir com a correção.' }],
        pending: true
      },
      // message.start already opened the reply bubble; no tool row is flushed.
      { id: 'assistant-stream-1', role: 'assistant', parts: [], pending: true }
    ])

    expect(texts(merged).filter(text => text === 'Hermes, vamos seguir com a correção.')).toHaveLength(1)
  })

  it('still draws a repeated prompt twice when an unflushed reply separates the turns', () => {
    const pageEndingAtThePrompt = toChatMessages([
      { id: 90, role: 'assistant', content: 'older context', timestamp: 90 },
      rows[0],
      rows[1],
      rows[2]
    ])

    const merged = graftRefreshedTailOntoBackfill(pageEndingAtThePrompt, [
      ...toChatMessages([rows[1]]),
      {
        id: 'assistant-stream-1',
        role: 'assistant',
        parts: [{ type: 'text', text: 'resposta ainda nao gravada' }],
        pending: true
      },
      {
        id: 'user-submission-2',
        role: 'user',
        parts: [{ type: 'text', text: 'Hermes, vamos seguir com a correção.' }],
        pending: true
      }
    ])

    expect(texts(merged).filter(text => text === 'Hermes, vamos seguir com a correção.')).toHaveLength(2)
  })
})
