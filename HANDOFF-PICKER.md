# HANDOFF — Picker (sticky de modelo) · 19/09/2026 13:35

## Bug original
Nova sessão abre no par antigo mesmo após pick manual confirmar outro. Quatro causas provadas em sequência:
- v16: resposta do switch perdida no transporte (reconciler por session.info);
- v16c: create lia o composer primário velho (pick em tile não repinta o primário);
- v17: seed restaurado do last-used fingindo ser `manual` (proveniência sticky_seed);
- v18: heartbeat de sessão NÃO-FOCADA sobrescrevia o sticky recém-confirmado.

## v18 (o que é)
Autoridade por foco na escrita PASSIVA do sticky: `syncRuntimeMetadataToView` só alimenta o last-used quando `sessionId === $focusedRuntimeId.get()` (o computed já espelha o runtime primário quando nenhuma tile está focada — sem fallback separado). Sessão não-focada segue atualizando slice/cache/view; só perde a escrita do sticky. Escritores EXPLÍCITOS (pick confirmado, Settings→Model, reconciler do pending) continuam incondicionais. Sem timestamp — recência não resolveria: heartbeat recente de sessão não-focada ainda venceria um pick antigo, errado por outra razão.

## Repro que fechou (autópsia 19/09 12:58)
pick Flash na tile 12:58:33 → sticky=flash → heartbeat da primária antiga (glm-5.3, não-focada, 12:58:33→48) → sticky voltou a glm-5.3 → New Session 12:58:48 leu glm-5.3. O teste v17 RESTART não pegava porque não simula sessão primária ativa re-alimentando o sticky entre pick e create.

## Estado
- Worktree `picker-rapido`, branch `feat/picker-rapido`. v18 = commit deste handoff.
- Instalação principal: v17 `93617e96c1`. Aplicação do v18 via robô tray (armado junto).
- Testes: direcionados 181/181 (T1+T2 novos no state-cache); ampla 185 arquivos / 2369 testes verdes (13:15).

## Gaps conhecidos (aceitos)
- New Session aberta ANTES da confirmação (janela TTL 45s) nasce no par velho.
- Runtime rebuild mid-turn (switch em conversa viva recria runtime com novo id) não reconcilia — não afeta pick em idle.

## Repro manual pós-aplicação
A) GLM 5.3 → New Session tile → pick Flash → "oi" → espera → New Session → nasce Flash.
B) Flash → pick GLM 5.3 → "oi" → New Session → nasce GLM 5.3.

## Probes
`[model-select]`, `[model-pick]`, `[model-pick-reconcile]`, `[model-selection-write]`, `[pill-slice]`, `[effort-trace]` em `logs/desktop.log` — saem antes de upstream.
