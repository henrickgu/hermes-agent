// -*- coding: utf-8 -*-
// Teste de regressao v21: o pick no pill TEM que alimentar o sticky.
//
// Cenario (repro real 20/09, 3 falhas antes):
//   usuario clica no pill e escolhe Baixo -> sessao nasce Baixo (ok)
//   -> sticky `last-effort` continua xhigh (velho) -> a PROXIMA New Session
//      semeia o pill do sticky velho (ou do profile default) -> veio no Medio.
//
// O pill click passava por `patchReasoning`, que gravava SOMENTE o atom do
// draft / o slice da sessao. O sticky — a memoria que alimenta o proximo new
// chat — nunca via o pick. Fix v21: `noteModelSelectionInUse` no caminho do
// clique, com rollback simetrico no catch.
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { $activeSessionId, $currentModel, $currentProvider, computeLastUsedSelection, noteModelSelectionInUse } from '@/store/session'
import { resolveFreshDraftEffort as resolve } from '@/lib/reasoning-effort'

const STICKY_KEYS = [
  'hermes.desktop.composer.last-model',
  'hermes.desktop.composer.last-provider',
  'hermes.desktop.composer.last-scope',
  'hermes.desktop.composer.last-effort'
]

/** Le a chave crua do localStorage — o sticky e gravado la pelo store. */
const readSticky = () => ({
  model: window.localStorage.getItem('hermes.desktop.composer.last-model'),
  provider: window.localStorage.getItem('hermes.desktop.composer.last-provider'),
  scope: window.localStorage.getItem('hermes.desktop.composer.last-scope'),
  effort: window.localStorage.getItem('hermes.desktop.composer.last-effort')
})

describe('v21 pill pick feeds the sticky', () => {
  beforeEach(() => {
    window.localStorage.clear()
    $activeSessionId.set('runtime-1')
    $currentProvider.set('stepfun')
    $currentModel.set('step-5-preview')
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('noteModelSelectionInUse grava o effort do pick no sticky (a chave que ficava xhigh)', () => {
    // Simula o sticky velho do usuario: pick anterior em xhigh.
    noteModelSelectionInUse('step-5-preview', 'stepfun', '', 'xhigh')
    expect(readSticky().effort).toBe('xhigh')

    // O que o patchReasoning agora faz no clique do pill:
    noteModelSelectionInUse('step-5-preview', 'stepfun', '', 'low')

    expect(readSticky().effort).toBe('low')
  })

  it('o proximo New Session semeia o pill do effort do pick (nao do valor velho)', () => {
    // Pick no pill: Baixo. O sticky passa a carregar o par + o nivel.
    noteModelSelectionInUse('step-5-preview', 'stepfun', '', 'low')

    // draft-init le o sticky (computeLastUsedSelection) e semeia o pill.
    const lastUsed = computeLastUsedSelection()
    expect(lastUsed.effort).toBe('low')

    // A semente do proximo new chat e o nivel do pick, nao o profile default.
    expect(resolve({ presetEffort: lastUsed.effort, profileDefault: 'medium' })).toBe('low')
  })

  it('esforço vazio NAO apaga o nivel gravado com o par (nao regride o sticky)', () => {
    noteModelSelectionInUse('step-5-preview', 'stepfun', '', 'low')
    noteModelSelectionInUse('step-5-preview', 'stepfun', '', '')

    expect(readSticky().effort).toBe('low')
  })

  it('o rollback do catch devolve o nivel anterior ao sticky', () => {
    // Sticky no nivel anterior ao pick.
    noteModelSelectionInUse('step-5-preview', 'stepfun', '', 'medium')

    // Clique -> low, gateway falha -> rollback para previous.
    noteModelSelectionInUse('step-5-preview', 'stepfun', '', 'low')
    noteModelSelectionInUse('step-5-preview', 'stepfun', '', 'medium')

    expect(readSticky().effort).toBe('medium')
  })

  it('as 4 chaves do sticky ficam preenchidas juntas (par + nivel viajam)', () => {
    noteModelSelectionInUse('step-5-preview', 'stepfun', '', 'minimal')

    expect(readSticky()).toEqual({
      model: 'step-5-preview',
      provider: 'stepfun',
      scope: '',
      effort: 'minimal'
    })
    expect(STICKY_KEYS.every(key => window.localStorage.getItem(key) !== null)).toBe(true)
  })
})
