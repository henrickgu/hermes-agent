// -*- coding: utf-8 -*-
// Teste v20: o effort do sticky semeia a draft nova (mesma proveniencia do par).
//
// Cenario (relato 20/09 11:46):
//   1. Sessao roda GLM-5.3 medium (session.info confirma) -> sticky grava
//      pair + effort=medium.
//   2. New Session -> draft nasce com o pill MEDIUM (antes: preset/default
//      vencia e o level se perdia).
//   3. Preset explicito por modelo ainda vence sobre o sticky (pin real).

import { beforeEach, describe, expect, it } from 'vitest'

import { computeLastUsedSelection, noteModelSelectionInUse } from '@/store/session'

describe('v20 sticky effort', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('recorda o effort junto com o par quando informado', () => {
    noteModelSelectionInUse('zai-org/GLM-5.3', 'commandcode', 'registry.local.default', 'medium')

    const sticky = computeLastUsedSelection()
    expect(sticky.model).toBe('zai-org/GLM-5.3')
    expect(sticky.provider).toBe('commandcode')
    expect(sticky.effort).toBe('medium')
  })

  it('nao apaga o effort previo quando o caller nao sabe o nivel', () => {
    noteModelSelectionInUse('zai-org/GLM-5.3', 'commandcode', 'registry.local.default', 'medium')
    // reconciler sem statePatch.reasoningEffort: undefined NAO limpa.
    noteModelSelectionInUse('zai-org/GLM-5.3', 'commandcode', 'registry.local.default', undefined)

    expect(computeLastUsedSelection().effort).toBe('medium')
  })

  it('atualiza o effort quando o par muda e traz level novo', () => {
    noteModelSelectionInUse('zai-org/GLM-5.3', 'commandcode', 'registry.local.default', 'medium')
    noteModelSelectionInUse('z-ai/glm-5.3-flash', 'commandcode', 'registry.local.default', 'high')

    const sticky = computeLastUsedSelection()
    expect(sticky.model).toBe('z-ai/glm-5.3-flash')
    expect(sticky.effort).toBe('high')
  })

  it('string vazia nao sobrescreve (mesma regra de undefined)', () => {
    noteModelSelectionInUse('zai-org/GLM-5.3', 'commandcode', 'registry.local.default', 'medium')
    noteModelSelectionInUse('zai-org/GLM-5.3', 'commandcode', 'registry.local.default', '')

    expect(computeLastUsedSelection().effort).toBe('medium')
  })
})
