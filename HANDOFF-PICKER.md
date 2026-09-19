# HANDOFF — Picker (sticky de modelo) · 19/09/2026 12:50

## Bug original
Nova sessão abre no par antigo mesmo após pick manual confirmar outro. Três causas provadas em sequência (v16: resposta perdida; v16c: create lia composer velho; v17: seed restaurado fingindo ser manual).

## v17 (o que é)
Proveniência do par no composer: `manual` (escolha explícita) / `sticky_seed` (restaurado do last-used) / `default`. Boot-rescope e draft-init escrevem `sticky_seed`. `desktopSessionCreateParams`: manual > sticky escopo-casante > default. Migração legada no getter: `manual` + par==sticky + nenhum pick nesta sessão de UI → rebaixa para `sticky_seed` (flag `explicitManualPickInThisUiSession` protege pick recém-feito). Guards de refresh automático protegem manual+sticky_seed; troca explícita de profile (force) continua reseedando. Pill badge aceita ambos.

## Autópsia upstream (encerrada)
Upstream puro `d7b836ab1c` (19/09) também falha o repro — não existe last-used/sticky cross-surface no main atual (paintSelection de tile não repinta composer; create só envia model se source=manual). Nada para onde migrar. Worktree `upstream-puro` mantido até o repro manual A/B passar.

## Estado
- Worktree `picker-rapido`, branch `feat/picker-rapido`. v17 = commit deste handoff.
- Instalação principal: v16c `162155b744`. Aplicação do v17 via robô tray (armado junto).
- Testes: direcionados 58/58; ampla 185 arquivos / 2367 testes verdes (12:34, com restart/migração incluído).

## Gap conhecido (aceito)
New Session aberta ANTES da confirmação (janela TTL 45s) ainda nasce no par velho. Documentado como residual.

## Repro manual pós-aplicação
A) GLM 5.3 → New Session tile → pick Flash → "oi" → espera → New Session → nasce Flash.
B) Flash → pick GLM 5.3 → "oi" → New Session → nasce GLM 5.3.

## Probes
`[model-select]`, `[model-pick]`, `[model-pick-reconcile]`, `[model-selection-write]`, `[pill-slice]`, `[effort-trace]` em `logs/desktop.log` — saem antes de upstream.
