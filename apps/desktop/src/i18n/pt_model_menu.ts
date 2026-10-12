import type { Translations } from './types'

export const ptModelMenu: Translations['shell']['modelMenu'] = {
  search: 'Buscar modelos',
  noModels: 'Nenhum modelo encontrado',
  editModels: 'Editar modelos…',
  followDefault: 'Usar padrão das configurações',
  refreshModels: 'Atualizar modelos',
  favorites: 'Favoritos',
  addFavorite: 'Adicionar aos favoritos',
  removeFavorite: 'Remover dos favoritos',
  favoriteShortcut: '⇧ Clique',
  fast: 'Rápido',
  free: 'grátis',
  cacheRead: 'leitura em cache',
  priceTitle: (input: string, output: string, cache: string) =>
    `Entrada ${input}/Mtok · Saída ${output}/Mtok` + (cache ? ` · Leitura em cache ${cache}/Mtok` : ''),
  limited: 'Limitado',
  limitedUntil: (time: string) => `Limitado até ${time}`,
  limitedTip: (provider: string, time: null | string) =>
    time
      ? `${provider} atingiu o limite de uso. Reinicia em ${time}; você já pode escolher um modelo para depois.`
      : `${provider} atingiu o limite de uso. Você pode escolher um modelo para usar depois que reiniciar.`,
  modelResets: (time: string) => `reinicia ${time}`,
  modelLimitedTip: (time: string) =>
    `Este modelo atingiu o próprio limite e reinicia em ${time}. Os outros modelos aqui continuam funcionando.`,
  usageLeft: (percent: number, time: null | string) =>
    time ? `${percent}% restante · reinicia ${time}` : `${percent}% restante`,
  poolAccounts: (count: number) => `${count} ${count === 1 ? 'conta' : 'contas'}`,
  poolLimited: (limited: number, total: number) => `${limited}/${total} contas limitadas`,
  poolAccount: (number: number) => `Conta ${number}`,
  poolUnknown: 'Uso indisponível',
  poolUnavailable: 'Entre novamente',
  usageTip: (provider: string) => `${provider} está perto do limite de uso.`,
  usageWindow: (label: string, percent: number, time: null | string) =>
    time ? `${label}: ${percent}% restante, reinicia ${time}` : `${label}: ${percent}% restante`
}
