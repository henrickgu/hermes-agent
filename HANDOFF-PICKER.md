# HANDOFF — Picker (sticky de modelo) · 19/09/2026 02:00

## Bug original
Nova sessão abre no par antigo mesmo após pick manual confirmar outro. Duas causas provadas e corrigidas em sequência.

## Causa 2 (prova completa nos logs de 19/09 ~00:54)
Pick em **tile focada** com painel primário em draft: confirmação via session.info
fazia `repaint=false` (guard consultava `$activeSessionId`=null) → composer primário
ficava no par velho → New Session nascia do par velho → retroalimentava o sticky.
NÃO era normalização do backend (state.db registrou `glm-5.3-flash` verbatim em tudo).

## v16c (este commit)
1. `isPrimaryRuntime` (ex-`isRuntimeActive`): repaint do composer primário só quando
   a confirmação nomeia o runtime do PRIMÁRIO. Pick de tile não repinta primário —
   slice da tile + sticky já cobrem.
2. `desktopSessionCreateParams`: precedência `manual composer > sticky escopo-casante
   > default do backend`, lida no ponto de linearização pré-await. É o fix principal:
   New Session (primária ou tile) nasce do sticky ATUAL, não do composer resolvido no boot.

## Repro manual pós-aplicação (dono: Henrick)
A) GLM 5.3 → New Session tile → pick Flash → "oi" → responder → New Session → **nasce Flash**.
B) inverso: Flash → pick GLM 5.3 → "oi" → New Session → **nasce GLM 5.3**.
Probes ativos: `[model-select]`, `[model-pick]`, `[model-pick-reconcile]` (agora com
`repaintPrimary=` + `session=`), `[model-selection-write]`, `[pill-slice]`, `[effort-trace]`
→ logs/desktop.log. Saem TODOS antes de upstream.

## Testes
- Direcionados 54/54 (session-info 15, model-controls 34, create-params 5 — arquivo novo).
- Amplia session+store: 185 arquivos / 2363 testes verdes (01:53→02:06).

## Gaps conhecidos (aceitos, não corrigir junto)
- New Session aberta ANTES da confirmação (janela TTL 45s) ainda nasce no par velho.
- Runtime rebuild mid-turn com novo session_id não reconcilia (pending morre por TTL).
- Probes no código (ver acima) — remover antes de encerrar/upstream.

## Estado
- Worktree `picker-rapido`: HEAD = este commit (v16c). Instalação principal: aplicar via robô.
- Aplicação: robô tray (FF merge + build + ExpectStamp). Nada de extra junto.
