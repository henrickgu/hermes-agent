import { describe, expect, it } from 'vitest'

import { DEFAULT_REASONING_EFFORT } from '@/lib/reasoning-effort'

import { jobEffortDisplay } from './cron-job-model'

// Regression for the cron detail panel hiding the effort row on jobs without a
// per-job pin: three of Henrick's jobs follow the profile default and the panel
// looked like the level "didn't exist" there. The row must ALWAYS render for
// LLM jobs, marking the inherited level so it never reads as pinned.
describe('jobEffortDisplay', () => {
  const inputs = (profileDefaultEffort: string) => ({
    profileDefaultEffort,
    suffix: ' (padrão do perfil)',
    labelFor: (level: string) => ({ high: 'Alto', medium: 'Médio' })[level] ?? level
  })

  it('a pinned effort wins and never carries the profile-default suffix', () => {
    const out = jobEffortDisplay({ reasoning_effort: 'high' }, inputs('medium'))

    expect(out).toEqual({ level: 'high', label: 'Alto', isProfileDefault: false })
  })

  it('no pin renders the EFFECTIVE profile default with the suffix', () => {
    const out = jobEffortDisplay({ reasoning_effort: null }, inputs('medium'))

    expect(out).toEqual({ level: 'medium', label: 'Médio (padrão do perfil)', isProfileDefault: true })
  })

  it('unknown/empty profile default falls back to the built-in medium', () => {
    expect(jobEffortDisplay({ reasoning_effort: null }, inputs(''))).toEqual({
      level: DEFAULT_REASONING_EFFORT,
      label: 'Médio (padrão do perfil)',
      isProfileDefault: true
    })
    expect(jobEffortDisplay({ reasoning_effort: null }, inputs('bogus'))).toEqual({
      level: DEFAULT_REASONING_EFFORT,
      label: 'Médio (padrão do perfil)',
      isProfileDefault: true
    })
  })

  it('a level outside the label map shows verbatim instead of guessing', () => {
    const out = jobEffortDisplay({ reasoning_effort: 'xhigh' }, inputs('medium'))

    expect(out).toEqual({ level: 'xhigh', label: 'xhigh', isProfileDefault: false })
  })

  it('script-only jobs run no LLM and get no row at all', () => {
    const scriptJob = { no_agent: true, script: 'watch.ps1', reasoning_effort: null }

    expect(jobEffortDisplay(scriptJob, inputs('medium'))).toBeNull()
  })
})
