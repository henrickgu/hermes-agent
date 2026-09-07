import { normalize } from '@/lib/text'

/** Hermes' reasoning levels, in ascending order — mirrors the backend's
 *  VALID_REASONING_EFFORTS (hermes_constants.py). `none` is not a level: it's
 *  thinking disabled, owned by the Thinking toggle rather than the scale. */
export const REASONING_EFFORTS = ['low', 'medium', 'high', 'xhigh', 'ultra'] as const

export type ReasoningEffort = (typeof REASONING_EFFORTS)[number]

/** The scale plus the off state — the full set a config value may hold. */
export const REASONING_EFFORT_VALUES = ['none', ...REASONING_EFFORTS] as const

/** Hermes' built-in level when neither the surface nor the profile config
 *  specifies one (mirrors the backend's own fallback). */
export const DEFAULT_REASONING_EFFORT: ReasoningEffort = 'medium'

/** Compact labels for chrome where space is tight (pill, picker rows). Menus
 *  and settings use the translated `shell.modelOptions` strings instead. */
const SHORT_LABELS: Record<string, string> = {
  none: 'Off',
  low: 'Low',
  medium: 'Med',
  high: 'High',
  xhigh: 'XHigh',
  ultra: 'Ultra'
}

export function reasoningEffortLabel(effort: string): string {
  const key = normalize(effort)

  return key ? (SHORT_LABELS[key] ?? effort) : ''
}

export const isReasoningEffort = (value: string): value is ReasoningEffort =>
  REASONING_EFFORTS.includes(normalize(value) as ReasoningEffort)

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
 *  full UI scale when unknown. The backend sends `native_efforts` from its
 *  transport clamping tables (verified, per-route vocabulary; wire names like
 *  `max` that the UI scale may not carry). Levels the scale doesn't render
 *  collapse to the nearest weaker rendered level, so a route whose top tier is
 *  `max` still gets a visible, honest "Ultra"-style entry instead of a value
 *  with no row. Pure function, shared by every effort menu. */
export function effortsForModel(nativeEfforts?: string[]): ReasoningEffort[] {
  if (!nativeEfforts || nativeEfforts.length === 0) {
    return [...REASONING_EFFORTS]
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
  // full scale rather than a menu with no rows.
  return out.length > 0 ? out : [...REASONING_EFFORTS]
}
