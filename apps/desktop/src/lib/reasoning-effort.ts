import { DEFAULT_REASONING_EFFORT, isReasoningEffort, REASONING_EFFORTS, REASONING_EFFORT_VALUES,
  TRIMMED_REASONING_EFFORTS,
  type ReasoningEffort,
  type TrimmedReasoningEffort } from '@hermes/shared'

import { normalize } from '@/lib/text'

// A escala vive no @hermes/shared (leva 9: minimal e max entraram na escala oficial).
export {
  DEFAULT_REASONING_EFFORT,
  isReasoningEffort,
  REASONING_EFFORTS,
  REASONING_EFFORT_VALUES,
  TRIMMED_REASONING_EFFORTS
}
export type { ReasoningEffort, TrimmedReasoningEffort }

/** Compact labels for chrome where space is tight (pill, picker rows). Menus
 *  and settings use the translated `shell.modelOptions` strings instead. */
const SHORT_LABELS: Record<string, string> = {
  none: 'Off',
  minimal: 'Min',
  low: 'Low',
  medium: 'Med',
  high: 'High',
  xhigh: 'XHigh',
  max: 'Max',
  ultra: 'Ultra'
}


/**
 * A pick the route does not send verbatim: `ultra` is a Hermes-internal step
 * that routes clamp to their strongest level (`max` on OpenAI-compatible wires; the Codex
 * app-server sends it verbatim as codex's own mode), and the
 * CLI's `/reasoning` says so ("ultra (sends max on this route)"). The wire
 * level comes from the gateway's `session.info.reasoning_effort_wire`; nothing
 * is inferred client-side, so an unknown ('' — not yet stamped, or an
 * optimistic pick) or verbatim wire reads as "no clamp".
 */
export function reasoningEffortClamp(
  effort: string,
  wire: string | undefined
): { effort: ReasoningEffort; wire: ReasoningEffort } | null {
  const picked = normalize(effort)
  const sent = normalize(wire ?? '')

  if (!sent || sent === picked || !isReasoningEffort(picked) || !isReasoningEffort(sent)) {
    return null
  }

  return { effort: picked, wire: sent }
}

/** Compact label; a clamped pick shows both ends ("Ultra→Max") so the pill
 *  never presents a Hermes step as a wire level the route does not have. */
export function reasoningEffortLabel(effort: string, wire?: string): string {
  const key = normalize(effort)
  const clamp = reasoningEffortClamp(effort, wire)

  if (clamp) {
    return `${SHORT_LABELS[clamp.effort]}→${SHORT_LABELS[clamp.wire]}`
  }

  return key ? (SHORT_LABELS[key] ?? effort) : ''
}

/** Thinking is on unless a level explicitly says otherwise; an empty value
 *  means "inherit", so it resolves through `fallback` first. */
export const isThinkingEnabled = (effort: string, fallback: string = DEFAULT_REASONING_EFFORT): boolean =>
  normalize(effort || fallback) !== 'none'

/** The level a scale control should show. Empty inherits `fallback`; `none`
 *  (thinking off) selects nothing; anything unrecognized clamps to the default. */
export function resolveReasoningEffort(effort: string, fallback: string = DEFAULT_REASONING_EFFORT): string {
  const value = normalize(effort || fallback)

  if (value === 'none') {
    return ''
  }

  return isReasoningEffort(value) ? value : DEFAULT_REASONING_EFFORT
}

/** Efforts the route officially accepts, mapped onto the UI scale — or the
 *  TRIMMED scale when unknown. The backend sends `native_efforts` from its
 *  transport clamping tables (verified, per-route vocabulary; wire names like
 *  `max` that the UI scale may not carry). Levels the scale doesn't render
 *  collapse to the nearest weaker rendered level, so a route whose top tier is
 *  `max` still gets a visible, honest "Ultra"-style entry instead of a value
 *  with no row. Pure function, shared by every effort menu. */
export function effortsForModel(nativeEfforts?: string[]): ReasoningEffort[] {
  if (!nativeEfforts || nativeEfforts.length === 0) {
    // Unknown route: offer the trimmed five, not the full wire vocabulary.
    // `minimal` collapses onto `low` and `ultra` is Hermes-internal, so both
    // read as noise to the user; a route that declares itself never lands here.
    return [...TRIMMED_REASONING_EFFORTS]
  }

  const out: ReasoningEffort[] = []

  for (const raw of nativeEfforts) {
    const key = normalize(raw)

    if (isReasoningEffort(key)) {
      if (!out.includes(key)) {
        out.push(key)
      }

      continue
    }

    // Wire level outside the UI scale (`max`): collapse to the top of the
    // rendered scale so the route's top tier stays reachable and labeled.
    if (key === 'max') {
      const top = REASONING_EFFORTS[REASONING_EFFORTS.length - 1]!

      if (!out.includes(top)) {
        out.push(top)
      }
    }
    // Unknown wire names (and `none`, owned by the Thinking toggle) are
    // skipped rather than guessed.
  }

  // Never empty: a route that exposes nothing renderable falls back to the
  // trimmed scale rather than a menu with no rows.
  return out.length > 0 ? out : [...TRIMMED_REASONING_EFFORTS]
}

/** The supported level closest to `from`: an exact hit stays; otherwise walk
 *  DOWN first (a route without the level errs weaker, never stronger), then
 *  up. `list` is a rendered-vocabulary output of `effortsForModel`. */
export function nearestReasoningEffort(list: ReasoningEffort[], from: ReasoningEffort): ReasoningEffort {
  if (list.includes(from)) {
    return from
  }

  const order = (value: ReasoningEffort): number => REASONING_EFFORTS.indexOf(value)
  const fromOrder = order(from)
  const weaker = list.filter(value => order(value) < fromOrder)

  if (weaker.length > 0) {
    return weaker[weaker.length - 1]!
  }

  const stronger = list.filter(value => order(value) > fromOrder)

  return stronger[0] ?? from
}

/** The level a NEW model should start at when a switch carries the old
 *  level over: `effort` kept within the new route's official vocabulary, or
 *  undefined when there is nothing safe to carry (empty/unknown level, or a
 *  route whose vocabulary is unknown — never guess, leave the level alone).
 *  `none` is not a level and never carries: the Thinking toggle owns it. */
export function carryReasoningEffort(effort: string, nativeEfforts?: string[]): ReasoningEffort | undefined {
  if (!isReasoningEffort(effort)) {
    return undefined
  }

  // Unknown vocabulary — nothing safe to carry onto (full-scale fallback is a
  // RENDERING fallback, not a guarantee the route accepts every level).
  if (!nativeEfforts || nativeEfforts.length === 0) {
    return undefined
  }

  return nearestReasoningEffort(effortsForModel(nativeEfforts), effort)
}

/** The ONE authority for a fresh chat's starting effort (v12).
 *  Order: 1) an EXPLICITLY applicable preset — only a level the user themselves
 *  pinned for this exact model/provider in the composer; 2) the profile default
 *  (`agent.reasoning_effort`); 3) the built-in default. Carry-over levels and
 *  display mirrors of a live session are NOT inputs here: a runtime must never
 *  re-seed the next draft's starting level. */
export function resolveFreshDraftEffort(inputs: { presetEffort?: string; profileDefault?: string }): string {
  const explicit = (inputs.presetEffort || '').trim()
  if (explicit) {
    return resolveReasoningEffort(explicit)
  }

  return resolveReasoningEffort((inputs.profileDefault || '').trim())
}
