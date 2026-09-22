/** Reasoning levels the UI OFFERS when a route has not declared its own
 *  vocabulary — the trimmed five the effort menu falls back to. Deliberately
 *  shorter than `REASONING_EFFORTS` (the full wire vocabulary, which the backend
 *  may still receive or clamp): `minimal` collapses onto `low` for most routes
 *  and `ultra` is a Hermes-internal step, so presenting seven rungs made the
 *  selector look broken instead of precise (#704). A route that DOES declare
 *  itself keeps its exact set via `native_efforts`. */
export const TRIMMED_REASONING_EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'] as const

export type TrimmedReasoningEffort = (typeof TRIMMED_REASONING_EFFORTS)[number]

/** Hermes' reasoning levels, in ascending order — mirrors the backend's
 *  VALID_REASONING_EFFORTS (hermes_constants.py). `none` is not a level: it's
 *  thinking disabled. */
export const REASONING_EFFORTS = ['minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'ultra'] as const

export type ReasoningEffort = (typeof REASONING_EFFORTS)[number]

/** The scale plus the off state — the full set a config value may hold. */
export const REASONING_EFFORT_VALUES = ['none', ...REASONING_EFFORTS] as const

export type ReasoningEffortValue = (typeof REASONING_EFFORT_VALUES)[number]

/** Hermes' built-in level when neither the surface nor the profile config
 *  specifies one (mirrors the backend's own fallback). */
export const DEFAULT_REASONING_EFFORT: ReasoningEffort = 'medium'

/** True for a real level (case-insensitive, trimmed); `none` is not a level. */
export const isReasoningEffort = (value: string): value is ReasoningEffort =>
  REASONING_EFFORTS.includes(value.trim().toLowerCase() as ReasoningEffort)
