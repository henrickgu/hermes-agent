/**
 * v16 — a model pick whose RPC failed/hung is a PENDING selection, not a
 * failed one: the backend may still apply the switch (transport dropped the
 * response), and the authoritative `session.info` will report the real pair.
 *
 * Registry shape: map runtimeId → {model, provider, seq, at}. The state-cache
 * reconciles against incoming `session.info` (same pair → commit: paint +
 * sticky; different pair or expiry → drop without touching the sticky).
 *
 * TTL exists so a backend that genuinely REFUSED can never leave the pending
 * hanging forever: without a confirming `session.info` within the window the
 * entry dies and the sticky keeps the previous value.
 */

export interface PendingModelPick {
  model: string
  provider: string
  seq: number
  at: number
}

const pending = new Map<string, PendingModelPick>()
let seqCounter = 0

/** A late `session.info` may only repaint the composer if the runtime it
 *  names is STILL the one on screen (a confirmation from session A must not
 *  repaint while the user sits on session B). */
let activeRuntimeProvider: null | (() => null | string) = null

export function setActiveRuntimeProvider(fn: null | (() => null | string)): void {
  activeRuntimeProvider = fn
}

export function isRuntimeActive(runtimeId: string): boolean {
  return activeRuntimeProvider?.() === runtimeId
}

export function registerPendingModelPick(runtimeId: string, model: string, provider: string): number {
  const seq = ++seqCounter
  pending.set(runtimeId, { model, provider, seq, at: Date.now() })
  return seq
}

export function consumePendingModelPick(runtimeId: string): PendingModelPick | undefined {
  return pending.get(runtimeId)
}

export function resolvePendingModelPick(runtimeId: string): PendingModelPick | undefined {
  const entry = pending.get(runtimeId)
  pending.delete(runtimeId)
  return entry
}

export function clearPendingModelPick(runtimeId: string): void {
  pending.delete(runtimeId)
}

/** The reconciler decides with this: a pending older than the window died
 *  without ever being confirmed (backend refused / no session.info ever
 *  arrived) — drop it, keep the sticky as-is. */
export const PENDING_MODEL_PICK_TTL_MS = 30_000

export function isPendingFresh(entry: PendingModelPick, now = Date.now()): boolean {
  return now - entry.at < PENDING_MODEL_PICK_TTL_MS
}

export function resetPendingModelPicksForTests(): void {
  pending.clear()
  seqCounter = 0
  activeRuntimeProvider = null
}
