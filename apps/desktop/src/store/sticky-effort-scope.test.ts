// -*- coding: utf-8 -*-
//
// Sticky de esforço: o caso ÓRFÃO — a falha que a suíte existente não cobre.
//
// Relato (Henrick, 25/09/2026): "o seletor só abre em Med em novas sessões, e
// não da memória do último esforço usado".
//
// Estado REAL lido do localStorage da máquina (leveldb de
// `%APPDATA%/Hermes/Local Storage`):
//
//   composer.last-effort                        = "max"   ← existia, órfã
//   composer.last-model / .last-provider / .last-scope      ← AUSENTES
//
// Mecanismo: as 4 chaves do sticky (`last-model`, `last-provider`,
// `last-scope`, `last-effort`) eram escritas e lidas SEM escopo desde o v14 —
// consistente entre si, mas GLOBAIS: valiam para qualquer backend desta área de
// localStorage, e nada garantia que o par e o nível fossem regravados juntos a
// cada pick. Na máquina do Henrick o leveldb só tinha `last-effort=max` órfã,
// sem par nenhum — e `computeLastUsedSelection()` é tudo-ou-nothing (exige
// model E provider), então nada semeava e o draft caía em preset/medium.
//
// O fix põe as 4 chaves no MESMO escopo do composer (`composerSelectionKey()`),
// escrita e leitura. Estes testes travam as duas metades: (A) gravado e lido
// sob o mesmo escopo, e (B) cada backend enxerga só o próprio sticky.

import { beforeEach, describe, expect, it } from 'vitest'

import {
  computeLastUsedSelection,
  noteModelSelectionInUse,
  setComposerSelectionOwner
} from '@/store/session'

/** As quatro chaves do sticky, no escopo `registry.<id>.<profile>`. */
const scopedKey = (base: string, id = 'local', profile = 'default'): string =>
  `${base}.registry.${encodeURIComponent(id)}.${encodeURIComponent(profile)}`

const MODEL_KEY = 'hermes.desktop.composer.last-model'
const PROVIDER_KEY = 'hermes.desktop.composer.last-provider'
const SCOPE_KEY = 'hermes.desktop.composer.last-scope'
const EFFORT_KEY = 'hermes.desktop.composer.last-effort'

describe('sticky de esforço — simetria de escopo (fix do caso órfão)', () => {
  beforeEach(() => {
    window.localStorage.clear()
    // Escopo explícito de registry: as chaves do sticky ganham sufixo.
    setComposerSelectionOwner('local', 'default')
  })

  it('grava o effort NO MESMO escopo do par (nunca na chave nua)', () => {
    noteModelSelectionInUse('step-5-preview', 'stepfun', 'registry.local.default', 'max')

    // O par e o nível dividem a mesma chave com sufixo.
    expect(window.localStorage.getItem(scopedKey(MODEL_KEY))).toBe('step-5-preview')
    expect(window.localStorage.getItem(scopedKey(EFFORT_KEY))).toBe('max')
    // ...e a chave nua NUNCA é escrita por um escopo explícito.
    expect(window.localStorage.getItem(EFFORT_KEY)).toBeNull()
  })

  it('o nível gravado sobrevive à releitura pelo sticky', () => {
    noteModelSelectionInUse('step-5-preview', 'stepfun', 'registry.local.default', 'max')

    expect(computeLastUsedSelection().effort).toBe('max')
  })

  it('órfã pré-fix (nível sem par) não vaza: o nível vem do escopo atual', () => {
    // Estado legado da máquina: só a chave nua existia.
    window.localStorage.setItem(EFFORT_KEY, 'max')

    // O par nunca foi gravado → o sticky continua tudo-ou-nothing.
    expect(computeLastUsedSelection().effort).toBe('')

    // Um pick real grava o par + o nível sob o escopo vigente.
    noteModelSelectionInUse('step-5-preview', 'stepfun', 'registry.local.default', 'high')

    expect(computeLastUsedSelection().effort).toBe('high')
    // E o nível legado, sem dono, não é adotado em nenhum momento.
    expect(window.localStorage.getItem(EFFORT_KEY)).toBe('max')
  })

  it('escopo diferente do gravado não herda o nível (sem bleed entre backends)', () => {
    noteModelSelectionInUse('step-5-preview', 'stepfun', 'registry.local.default', 'max')

    // Outro gateway entra no mesmo storage: enxerga o PRÓPRIO escopo (vazio).
    setComposerSelectionOwner('aibox', 'default')

    expect(computeLastUsedSelection().effort).toBe('')
  })
})
