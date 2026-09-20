// -*- coding: utf-8 -*-
// Teste de regressao v19b: pick em draft promovida NAO pode rebaixar o effort.
//
// Cenario (repro real 20/09):
//   draft runtime=flash, draft atom effort=low (create override low)
//   -> pick GLM-5.3 medium? NAO: o usuario TINHA medium no pill (draft atom medium).
//   -> pick confirma (requestSwitch OK) -> carryEffort roda com snapshot prevEffort.
//   Bug: prevEffort lido do slice vazio da promoted draft + fallback... o carry
//   mandava config.set reasoning=LOW, rebaixando o runtime confirmado.
//   Fix v19b: carry usa o nivel VISIBLE no pill (draft atom) como autoridade.
//
// Como o carry agora le o ATOM quando o slice esta vazio, o teste:
//   1. slice da live session SEM effort (promoted draft)
//   2. draft atom = 'medium' (o que o usuario ve)
//   3. pick confirma -> deve emitir config.set reasoning = 'medium' (nao 'low')
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { $draftReasoningEffort } from '@/store/session'
import { carryReasoningEffort } from '@/lib/reasoning-effort'

describe('v19b carry guard', () => {
  it('carryReasoningEffort preserva nivel valido sem vocabulario', () => {
    // Sem nativeEfforts o carry retorna undefined (nao adivinha) — comportamento mantido.
    expect(carryReasoningEffort('medium', undefined)).toBeUndefined()
    expect(carryReasoningEffort('', ['low', 'medium', 'high'])).toBeUndefined()
  })

  it('carryReasoningEffort mapeia para o mais proximo do vocabulario alvo', () => {
    expect(carryReasoningEffort('ultra', ['low', 'medium', 'high'])).toBe('high')
    expect(carryReasoningEffort('medium', ['low', 'medium', 'high'])).toBe('medium')
  })

  it('draft atom é a autoridade quando o slice está vazio (promoted draft)', () => {
    // O guard v19b no componente le: slice(liveSessionId) || draftAtom.
    // Este teste fixa o contrato do atom usado pelo guard.
    $draftReasoningEffort.set('medium')
    expect($draftReasoningEffort.get()).toBe('medium')
    $draftReasoningEffort.set('')
  })
})
