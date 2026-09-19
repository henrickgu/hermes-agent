# HANDOFF — Picker (sticky de modelo) · 19/09/2026 00:45

## Bug
Nova sessão abre no par antigo (glm-5.3-flash) mesmo após pick manual confirmar glm-5.3. Fluxo repro: pick manual → "oi" → aguardar responder → New Session.

## Estado
- Worktree `picker-rapido` LIMPO. HEAD = `ae1dfb430b` (v16b, sobre v16 `0a36ed6f63`).
- **v16b AUTORIZADO pelo Henrick (19/09 00:38): "congelar esse diff e aplicar exatamente essa versão para o teste manual".** Robô tray-robot armado para aplicar no idle.
- Instalação principal no v15 `98fa4fbf17` (build 17/09 16:23) até o robô agir.
- 3 arquivos NÃO commitados na instalação (probes Python: `methods_session.py`, `server.py`, `methods_config_set.py`) NÃO colidem com o v16b (só `apps/desktop/src`).

## v16b (o que é — em cima do v16)
1. **Catch guard por seq**: rollback do paint otimista só se o pending daquele seq ainda vive. Confirmação já consumida pelo session.info = estado autoritativo; timeout tardio do RPC não desfaz. Pending SOBREVIVE ao transport-failure (peek, não delete).
2. **Reconcile exige `explicitSid`**: broadcast/fan-out sem id não julga pending de outro runtime.
3. **TTL derivado**: `PENDING_MODEL_PICK_TTL_MS = DEFAULT_GATEWAY_REQUEST_TIMEOUT_MS + 15s` (45s > 30s do RPC — janela pós-catch deixa de ter largura zero).
4. **Sticky assertado**: `computeLastUsedSelection()` direto nos 3 testes v16 + 4 testes novos (fan-out, corrida confirmação-vs-timeout, falha real, objetivo central pick→last-used).
- Success path também seq-guarda o consumo (pick novo não morre por sucesso tardio de pick antigo).
- 3 imports mortos do v16 removidos.

## Testes (tudo verde)
- Direcionados: 48/48 (2 arquivos).
- Suíte session+store: 184 arquivos / 2357 testes (19/09 00:42).
- Lint: 0 erros nos 6 arquivos tocados.

## Gap conhecido (registrado, NÃO tratado — decisão do Henrick)
- Runtime rebuild com novo `session_id` na confirmação (switch mid-turn) — pending keyed pelo id antigo morre por TTL. Não afeta o repro de pick em sessão idle.

## Pendências
- Probes `console.error` (`[model-pick*]`, `[model-select]`, `[model-selection-write]`, `[model-pick-reconcile]`) SEGUEM no build para o teste manual; saem antes de upstream/encerramento.
- Probes Python da instalação principal (3 arquivos) revertidos só depois do teste manual.

## Repro manual (depois de aplicado)
Pick manual GLM 5.3 → "oi" → aguardar responder → New Session → nova sessão deve nascer em glm-5.3 (ver `[model-pick-reconcile]` no desktop.log e `billing_provider`/model no state.db).
