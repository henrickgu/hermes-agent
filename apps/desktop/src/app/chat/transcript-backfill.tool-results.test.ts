import { expect, it } from 'vitest'

import { chatPartsEquivalent } from '@/app/session/hooks/use-session-actions/message-equivalence'
import { transcriptRowIds } from '@/app/session/hooks/use-session-actions/pending-turn-identity'
import { delegateRowsFromCall, isDelegateRowLive } from '@/components/assistant-ui/tool/delegate-model'
import { type ChatMessage, type ChatMessagePart, chatMessageText, toChatMessages } from '@/lib/chat-messages'
import type { SessionMessage } from '@/types/hermes'

import { graftRefreshedTailOntoBackfill, mergeOlderTranscriptPage } from './transcript-backfill'

const call = (id: number, toolId: string, toolName = 'delegate_task'): SessionMessage => ({
  id,
  role: 'assistant',
  content: 'Keep the introduction.',
  timestamp: 1000 + id,
  tool_calls: [{ id: toolId, type: 'function', function: {
    name: toolName,
    arguments: JSON.stringify({ tasks: [{ goal: 'Backend' }, { goal: 'Interface' }] })
  } }]
})

const result = (id: number, toolId: string, body: unknown, toolName = 'delegate_task'): SessionMessage => ({
  id,
  role: 'tool',
  tool_name: toolName,
  tool_call_id: toolId,
  timestamp: 1000 + id,
  content: JSON.stringify(body),
  display_metadata: { tool_result_metadata: { inline_diff: 'verified diff' } }
})

const prompt = (id: number): SessionMessage => ({ id, role: 'user', content: `Turn ${id}`, timestamp: 1000 + id })
const reply = (id: number): SessionMessage => ({ id, role: 'assistant', content: 'Keep the final answer.', timestamp: 1000 + id })

const tools = (messages: ChatMessage[]) => messages.flatMap(message => message.parts.filter(
  (part): part is Extract<ChatMessagePart, { type: 'tool-call' }> => part.type === 'tool-call'
))

it('joins a tool result cut from its call by pagination without phantom delegate workers or lost rows', () => {
  const body = { status: 'dispatched', delegation_id: 'synthetic-batch', goals: ['Backend', 'Interface'] }
  const raw = [prompt(1), call(2, 'build'), result(3, 'build', body), reply(4)]
  const earlier = toChatMessages(raw.slice(0, 2))
  const tail = toChatMessages(raw.slice(2))
  const before = structuredClone({ earlier, tail })
  const joined = mergeOlderTranscriptPage(tail, earlier)
  const cards = tools(joined)
  expect(cards).toHaveLength(1)
  expect(cards[0].args).toEqual({ tasks: [{ goal: 'Backend' }, { goal: 'Interface' }] })
  expect(cards[0].result).toEqual(body)
  expect(cards[0].toolResultMetadata).toEqual({ inline_diff: 'verified diff' })
  expect(cards[0].unpairedStoredToolResult).not.toBe(true)
  expect(chatPartsEquivalent(cards[0], { ...cards[0], resultSourceRowId: undefined })).toBe(false)
  expect(chatPartsEquivalent(cards[0], { ...cards[0], sourceToolCallId: 'another-occurrence' })).toBe(false)
  const workers = delegateRowsFromCall(cards[0].args, cards[0].result, cards[0].toolCallId)
  expect(workers.map(row => row.goal)).toEqual(['Backend', 'Interface'])
  expect(workers.some(row => isDelegateRowLive(row.status))).toBe(false)
  const text = joined.map(chatMessageText).join('\n')
  expect(text).toContain('Keep the introduction.')
  expect(text).toContain('Keep the final answer.')
  expect(new Set(joined.flatMap(transcriptRowIds))).toEqual(new Set(raw.map(row => row.id)))
  expect(joined.reduce((sum, message) => sum + (message.serverRowSpan ?? 1), 0)).toBe(raw.length)
  expect(mergeOlderTranscriptPage(joined, earlier)).toBe(joined)
  expect(mergeOlderTranscriptPage(joined, toChatMessages(raw))).toBe(joined)
  const splitWindow = [...earlier, ...tail]
  expect(tools(graftRefreshedTailOntoBackfill(splitWindow, splitWindow))).toHaveLength(1)
  expect({ earlier, tail }).toEqual(before)
})

it('does not reintroduce a represented result when a joined window refreshes the same tail', () => {
  const body = { status: 'dispatched', delegation_id: 'synthetic-batch' }
  const raw = [prompt(1), call(2, 'build'), result(3, 'build', body), reply(4)]
  const tail = toChatMessages(raw.slice(2))
  const joined = mergeOlderTranscriptPage(tail, toChatMessages(raw.slice(0, 2)))
  const before = structuredClone(joined)
  const refreshed = graftRefreshedTailOntoBackfill(tail, joined)

  expect(tools(refreshed)).toHaveLength(1)
  expect(tools(refreshed)[0].result).toEqual(body)
  expect(new Set(refreshed.flatMap(transcriptRowIds))).toEqual(new Set(raw.map(row => row.id)))
  expect(refreshed.reduce((sum, message) => sum + (message.serverRowSpan ?? 1), 0)).toBe(raw.length)
  expect(tools(graftRefreshedTailOntoBackfill(tail, refreshed))).toHaveLength(1)
  expect(joined).toEqual(before)
})

it('preserves a tool-only call and its arguments when an older page overlaps the result row', () => {
  const args = { command: 'synthetic' }

  const invocation: SessionMessage = {
    ...call(2, 'run', 'terminal'),
    content: '',
    tool_calls: [{ id: 'run', type: 'function', function: { name: 'terminal', arguments: JSON.stringify(args) } }]
  }

  const raw = [prompt(1), invocation, result(3, 'run', 'RESULT', 'terminal'), reply(4)]
  const existing = toChatMessages(raw.slice(2))
  const older = toChatMessages(raw.slice(0, 3))
  const before = structuredClone({ existing, older })
  const joined = mergeOlderTranscriptPage(existing, older)

  expect(tools(joined)).toHaveLength(1)
  expect(tools(joined)[0].args).toEqual(args)
  expect(tools(joined)[0].result).toBe('RESULT')
  expect(new Set(joined.flatMap(transcriptRowIds))).toEqual(new Set(raw.map(row => row.id)))
  expect(joined.reduce((sum, message) => sum + (message.serverRowSpan ?? 1), 0)).toBe(raw.length)
  expect(mergeOlderTranscriptPage(joined, older)).toBe(joined)
  expect({ existing, older }).toEqual(before)
})

it('pairs only an unambiguous occurrence in the same turn and preserves falsy results, failures and unrelated content', () => {
  for (const body of [null, false, 0, '', { error: 'Real failure' }]) {
    const raw = [prompt(1), call(2, 'same', 'terminal'), result(3, 'same', body, 'terminal'), reply(4)]
    const joined = mergeOlderTranscriptPage(toChatMessages(raw.slice(2)), toChatMessages(raw.slice(0, 2)))
    expect(tools(joined)).toHaveLength(1)
    expect(tools(joined)[0].result).toEqual(body)
    expect(tools(joined)[0].completedAt).toBe(1003)
  }

  // Identical legacy IDs in a later user turn are separate calls, never a join by goal or ID alone.
  const separate = [prompt(1), call(2, 'reused'), reply(3), prompt(4), result(5, 'reused', 'later'), reply(6)]
  const joined = mergeOlderTranscriptPage(toChatMessages(separate.slice(4)), toChatMessages(separate.slice(0, 4)))
  expect(tools(joined)).toHaveLength(2)
  expect(Object.hasOwn(tools(joined)[0], 'result')).toBe(false)
  expect(tools(joined)[1].unpairedStoredToolResult).toBe(true)

  // Parallel legacy calls reusing an ID cannot be paired safely without stronger identity.
  const ambiguous = [prompt(1), call(2, 'duplicate'), call(3, 'duplicate'), result(4, 'duplicate', 'unknown')]
  expect(tools(mergeOlderTranscriptPage(toChatMessages(ambiguous.slice(3)), toChatMessages(ambiguous.slice(0, 3))))).toHaveLength(3)
})