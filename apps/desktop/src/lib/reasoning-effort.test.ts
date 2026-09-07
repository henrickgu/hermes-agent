import { describe, expect, it } from 'vitest'

import {
  DEFAULT_REASONING_EFFORT,
  effortsForModel,
  isReasoningEffort,
  isThinkingEnabled,
  REASONING_EFFORT_VALUES,
  REASONING_EFFORTS,
  reasoningEffortLabel,
  resolveReasoningEffort
} from './reasoning-effort'

describe('reasoning-effort', () => {
  it('keeps the scale ascending and `none` off it', () => {
    expect(REASONING_EFFORTS).not.toContain('none')
    expect(REASONING_EFFORT_VALUES[0]).toBe('none')
    expect(REASONING_EFFORT_VALUES).toHaveLength(REASONING_EFFORTS.length + 1)
  })

  it('labels every level it claims to support', () => {
    for (const effort of REASONING_EFFORT_VALUES) {
      expect(reasoningEffortLabel(effort)).not.toBe('')
    }

    expect(reasoningEffortLabel('')).toBe('')
    // Unknown values pass through rather than silently reading as a real level.
    expect(reasoningEffortLabel('bogus')).toBe('bogus')
  })

  it('recognizes only real scale levels', () => {
    expect(isReasoningEffort(DEFAULT_REASONING_EFFORT)).toBe(true)
    expect(isReasoningEffort('HIGH')).toBe(true)
    expect(isReasoningEffort('none')).toBe(false)
    expect(isReasoningEffort('bogus')).toBe(false)
  })

  it('treats empty as inherit and only `none` as off', () => {
    expect(isThinkingEnabled('none')).toBe(false)
    expect(isThinkingEnabled('high')).toBe(true)
    // Empty inherits the fallback, so an off fallback reads as off.
    expect(isThinkingEnabled('', 'none')).toBe(false)
    expect(isThinkingEnabled('', 'high')).toBe(true)
  })

  it('resolves a scale value: inherit, off, or clamp', () => {
    expect(resolveReasoningEffort('high')).toBe('high')
    // Empty inherits the profile default rather than snapping to medium.
    expect(resolveReasoningEffort('', 'ultra')).toBe('ultra')
    // Off selects nothing on the scale.
    expect(resolveReasoningEffort('none')).toBe('')
    expect(resolveReasoningEffort('bogus')).toBe(DEFAULT_REASONING_EFFORT)
  })
})

describe('effortsForModel', () => {
  it('unknown route falls back to the full scale', () => {
    expect(effortsForModel(undefined)).toEqual([...REASONING_EFFORTS])
    expect(effortsForModel([])).toEqual([...REASONING_EFFORTS])
  })

  it('maps the GLM-5.3 native vocabulary, collapsing max onto the top', () => {
    expect(effortsForModel(['low', 'medium', 'high', 'max'])).toEqual([
      'low',
      'medium',
      'high',
      'ultra'
    ])
  })

  it('keeps native xhigh rows and drops unknown wire names', () => {
    expect(effortsForModel(['none', 'low', 'medium', 'high', 'xhigh'])).toEqual([
      'low',
      'medium',
      'high',
      'xhigh'
    ])
  })

  it('never returns an empty menu', () => {
    expect(effortsForModel(['none'])).toEqual([...REASONING_EFFORTS])
    expect(effortsForModel(['bogus'])).toEqual([...REASONING_EFFORTS])
  })
})
