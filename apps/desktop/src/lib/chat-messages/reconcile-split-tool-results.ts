import type { ChatMessage, ChatMessagePart } from './types'

type ToolPart = Extract<ChatMessagePart, { type: 'tool-call' }>
interface Location {
  message: number
  part: number
}

/** Rejoin a stored result whose call was on the preceding history page.
 * A missing result is not evidence of running work, nor is a dispatch a success.
 * Only a uniquely identified, preceding call inside the same turn can own it. */
export function reconcileSplitToolResults(messages: ChatMessage[]): ChatMessage[] {
  const waiting = new Map<string, Location[]>()
  const represented = new Map<number, Location>()
  const edited = new Map<number, ChatMessage>()
  const removed = new Map<number, Set<number>>()

  const edit = (index: number): ChatMessage => {
    let message = edited.get(index)

    if (!message) {
      message = { ...messages[index], parts: [...messages[index].parts] }
      edited.set(index, message)
    }

    return message
  }

  const attach = (owner: Location, result: ToolPart, donorIndex: number, partIndex: number, newRow = true) => {
    const destination = edit(owner.message)
    const call = destination.parts[owner.part] as ToolPart
    destination.parts[owner.part] = {
      ...call,
      result: result.result,
      completedAt: result.completedAt,
      resultSourceRowId: result.sourceRowId,
      storedResultToolName: result.storedResultToolName ?? result.toolName,
      toolResultMetadata: result.toolResultMetadata,
      isError: result.isError
    }
    const discarded = removed.get(donorIndex) ?? new Set<number>()
    discarded.add(partIndex)
    removed.set(donorIndex, discarded)

    if (owner.message !== donorIndex) {
      const donor = edit(donorIndex)

      if (newRow) {
        destination.serverRowSpan = (destination.serverRowSpan ?? 1) + 1
      }

      donor.serverRowSpan = (donor.serverRowSpan ?? 1) - 1
    }
  }

  messages.forEach((message, messageIndex) => {
    if (message.role !== 'assistant') {
      // A legacy backend can reuse the same tool ID in another turn.
      waiting.clear()

      return
    }

    message.parts.forEach((part, partIndex) => {
      if (part.type !== 'tool-call' || !part.toolCallId) {
        return
      }

      const key = part.sourceToolCallId ?? part.toolCallId

      if (!part.unpairedStoredToolResult) {
        if (Object.hasOwn(part, 'result')) {
          waiting.delete(key)

          if (part.resultSourceRowId !== undefined) {
            represented.set(part.resultSourceRowId, { message: messageIndex, part: partIndex })
          }
        } else {
          waiting.set(key, [...(waiting.get(key) ?? []), { message: messageIndex, part: partIndex }])
        }

        return
      }

      // A refresh can carry a result row that backfill already moved onto its
      // call. Preserve the call's arguments, but count that durable row once.
      const existing = part.sourceRowId === undefined ? undefined : represented.get(part.sourceRowId)

      if (existing && Object.hasOwn(part, 'result')) {
        attach(existing, part, messageIndex, partIndex, false)

        return
      }

      const candidates = waiting.get(key)

      if (!Object.hasOwn(part, 'result') || candidates?.length !== 1) {
        return
      }

      const owner = candidates[0]
      const call = messages[owner.message].parts[owner.part] as ToolPart

      // A deferred bridge can persist the concrete tool's name on the result.
      if (call.toolName !== part.toolName && call.toolName !== 'tool_call') {
        return
      }

      attach(owner, part, messageIndex, partIndex)

      if (part.sourceRowId !== undefined) {
        represented.set(part.sourceRowId, owner)
      }

      waiting.delete(key)
    })
  })

  if (!removed.size) {
    return messages
  }

  return messages.flatMap((original, index) => {
    const changed = edited.get(index)
    const discarded = removed.get(index)

    if (!discarded) {
      return [changed ?? original]
    }

    const message = changed ?? edit(index)
    const parts = message.parts.filter((_, partIndex) => !discarded.has(partIndex))

    if (!parts.length && !message.error && !message.asyncResult && !message.interrupted && !message.reactions?.length) {
      return []
    }

    const removedSource = original.parts.some((part, partIndex) =>
      discarded.has(partIndex) && part.sourceRowId !== undefined && part.sourceRowId === original.rowId
    )

    return [{
      ...message,
      parts,
      ...(removedSource ? { rowId: parts.find(part => part.sourceRowId !== undefined)?.sourceRowId } : {})
    }]
  })
}