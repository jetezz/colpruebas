# APPLY-WU-TSK-1 — Evidencia de implementación (AC-004 TAREAS)

> Lane: `sdd-apply-code-high` · Unit: `WU-TSK-1` · apply_lane: `code-high`
> Objetivo: AC-004 — pin locator a binding v9.0.0 + regenerar projections client (estabiliza
> base de workflow antes de producto).
> Estado de la unit: `done` · Archivo de evidencia: este artifact.
> Estándar inyectado: `projectctl-requirements` v10.0.0 / binding `task-flow-binding` v9.0.0.

---

## 1. Pre-implementation gate (code-high — full 5-check + cross-cutting)

| Gate | Resultado | Evidencia |
| --- | --- | --- |
| **Scope** | PASS | Unit `WU-TSK-1`, `apply_lane: code-high`, archivos owned exactos: `.agents/sdd-workflow.json` (MODIFIED), `frontend/src/views/projectctl/data/tareas-tab.view-model.ts` (NEW generated), `frontend/src/shared/sdd/task-flow.generated.ts` (NEW generated). Nada más tocado. |
| **Spec linkage** | PASS | REQ-TSK-001 (locator 8.0.0→9.0.0, resto preservado); REQ-TSK-002 (`taskflow:generate` produce ambas projections); REQ-TSK-004 (R-007 pasa con pin v9 + projections presentes). |
| **Implementation target** | PASS | Concreto: cambiar solo `binding_version` en el locator; generar las 2 projections client determinísticamente desde el bloque `task-flow-binding` v9.0.0 (design §3.4/§5.8). |
| **Verification target** | PASS | `.agents/sdd-workflow.json` con `binding_version == "9.0.0"` y los otros 5 campos byte-iguales; ambas projections existen y son TypeScript válido. |
| **Failure routing** | PASS | `code_issue` en caso de fallo. |

### Cross-cutting safety gate (code-high)

| Check | Resultado | Notas |
| --- | --- | --- |
| **Migration safety** | PASS (no aplica) | Sin archivos bajo `supabase/migrations/` ni cambios de schema. |
| **Security contracts** | PASS (no aplica) | Sin cambios de auth/credentials/tunnel. |
| **Cross-surface consistency** | PASS | Las policies `frontend-policy`, `backend-api-policy`, `supabase-data-policy`, `sandbox-runtime-policy` NO están instaladas en este repo (gap conocido, deliverables de AC-005/AC-001 de esta misma task). Para ESTA unit no aplican: los owned files son 1 config + 2 proyecciones generadas sin producto hand-authored. Coherencia locator/binding + forma de archivo generado verificadas contra el sibling `phase-state-schema.json` (ver §3). |
| **Runtime contracts** | PASS (no aplica) | Sin cambios de sandbox/PTY/workspace-write. |

Cross-cutting global: **PASS** — conflict group `workflow-locator`, modo serial, sin dependencias
sin resolver. Superficie cross-cutting genuinamente tocada: locator (binding coherence) +
forma de generado (consistencia con sibling projection) — ambas cubiertas en §3. No se toca
ninguna otra superficie no cubierta.

---

## 2. Implementación

### 2.1 `.agents/sdd-workflow.json` (MODIFIED)

Solo se cambió `binding_version` de `"8.0.0"` a `"9.0.0"`. Campos preservados byte-iguales
(Round-trip JSON verificado por relectura y comparación campo a campo):

| Campo | Valor (preservado) |
| --- | --- |
| `contract_version` | `1` |
| `binding_path` | `.agents/skills/projectctl-requirements/references/tareas.md` |
| `machine_block_id` | `task-flow-binding` |
| `expected_binding_id` | `projectctl-requirements.task-flow` |
| `projections` | las 4 entradas byte-iguales (`state_model`, `task_template`, `client_view_model`, `client_generated_ts`) |

### 2.2 Projections client — NOTA sobre `taskflow:generate`

COORDINATOR-RESOLVED: el comando `taskflow:generate` NO existe en este repo (no hay `scripts/`,
no hay generador, no hay package script — verificado; las únicas menciones son en
spec/design/tasks.md como contrato a cumplir). Por lo tanto ambas projections se **hand-generaron
determinísticamente** desde el bloque `task-flow-binding` (JSON fenced v9.0.0) de
`.agents/skills/projectctl-requirements/references/tareas.md`, espejando la forma/estilo de
derivación del sibling projection existente `.agents/skills/projectctl-requirements/generated/phase-state-schema.json`
(contexto: frontend es un esqueleto Astro mínimo — `src/lib`, `src/pages` — sin `src/views/`
ni `src/shared/` previos; los paths de proyección del locator se crearon como NEW).

**`frontend/src/shared/sdd/task-flow.generated.ts`** (NEW generated):
- Header JSDoc: "AUTO-GENERATED from projectctl-requirements task-flow-binding v9.0.0 — do not edit by hand."
- Exporta constantes readonly tipadas: `TASK_FLOW_BINDING`, `STATUS_WRITABLE`, `STATUS_PRE_BOOTSTRAP`,
  `STATUS_TERMINAL`, `PHASES` (id/status/states/allowedLanes/transitions), `CONTROLS`
  (id/kind/writesState/owner/value|status/preserves/transitions), `DELIVERY`
  (source/target/branchPattern/actionOrder), `RETIRED_ALIASES`. Tipos: `TaskFlowWorkflowStatus`,
  `TaskFlowPhase`, `TaskFlowTransition`, `TaskFlowControlKind`, `TaskFlowControl`.

**`frontend/src/views/projectctl/data/tareas-tab.view-model.ts`** (NEW generated):
- View model client para la tab tareas, derivado de `task-flow.generated.ts` (importa
  `TASK_FLOW_BINDING`, `STATUS_*`, `CONTROLS`, `DELIVERY`, `RETIRED_ALIASES`, `TaskFlowPhase`).
- Exporta `TAREAS_TAB_VIEW_MODEL` (binding/status/phases/controls/delivery/modes/retiredAliases).
- Incluye grupos de phases con states y transitions, controles, set de status, modos
  (review/delivery con defaults y allowed) y el filtro de aliases retirados. Data-derived, sin
  lógica de negocio.

### 2.3 Verificación narrow (implementation-local, sin installs)

No hay `typescript` instalado y `bunx tsc --noEmit` requeriría descarga (install) → se usó el
transpilador integrado de Bun (`bun build --no-install`) + carga runtime:

- `frontend/src/shared/sdd/task-flow.generated.ts`: **parse/transpile OK**.
- `frontend/src/views/projectctl/data/tareas-tab.view-model.ts`: **build/transpile OK** (import
  resuelto; primero el path relativo se corrigió de `../../shared` a `../../../shared`, dado
  `data/` → `src/`).
- Import runtime de `TAREAS_TAB_VIEW_MODEL` OK: `binding_version == "9.0.0"`, `phases.length == 4`,
  `controls.length == 7`, `delivery.actionOrder == [final_commit_pending, final_push_pending,
  final_pr_pending, done]`, `status.writable.length == 8`, `retiredAliases.length == 34`,
  `modes == [review, delivery]`.

---

## 3. Coherencia y forma del generado (cross-cutting)

- **Locator/binding**: `binding_version` ahora coincide con `binding_version: "9.0.0"` del bloque
  y con `source.binding_version` del sibling projection `phase-state-schema.json`. `expected_binding_id`
  y `machine_block_id` coherentes con el bloque.
- **Forma del generado vs sibling**: `task-flow.generated.ts`/`tareas-tab.view-model.ts` reflejan
  los mismos `phases[4]`, `controls[7]`, `status.writable[8]`, `delivery.action_order` y
  `retired_aliases[34]` que `phase-state-schema.json`. Coherente.
- No se tocó ni UNO de los archivos de `active_sources.include/exclude` ni el bloque binding.

---

## 4. Delivery risk report (extended — code-high)

- **Force-add requirements**: NONE. Los 3 owned files están bajo la superficie de commit normal
  del repo (`.agents/`, `frontend/src/`); no están gitignored.
- **Migration impact**: NONE. Sin schema SQL, RLS ni grants.
- **Contract changes**: (a) `.agents/sdd-workflow.json` — cambio de campo `binding_version`
  `8.0.0` → `9.0.0` (pin al binding canónico v9); (b) dos NUEVAS proyecciones client generadas
  derivadas del binding. **Infra gap notificado**: el generador `taskflow:generate` NO existe en
  este repo; futuro generador debería emitir output equivalente a estas proyecciones. Como estas
  proyecciones son **no autoritativas** (contrato §3), la ausencia de generador no afecta la
  resolución.
- **Rollback plan**: revertir `binding_version` a `"8.0.0"` en `.agents/sdd-workflow.json` y
  eliminar los dos archivos generados. Las proyecciones derivadas son no autoritativas per contrato
  §3 — la resolución no se ve afectada.

---

## 5. Criterios / tasks contract

- `criteria_covered`: **AC-004**
- Spec scenarios satisfechos: REQ-TSK-001, REQ-TSK-002, REQ-TSK-004 (parcial; R-007 se valida en
  fase 3 con `sot-coherence.test.ts`).
- Deviations: NONE. (`taskflow:generate` no ejecutado — se hand-generó per fact del coordinador;
  documentado arriba como infra gap, no como desviación del contrato de la unit.)
- Unresolved follow-up: el test gate R-007 (`frontend/__tests__/projectctl-requirements.sot-coherence.test.ts`)
  es deliverable de WU-TST-2 (fase 3); se validará verde post-implementación.

---

**criteria_covered**: AC-004
**next_recommended**: WU-TSK-2 (`sdd-apply-code-low`) — retiro de estados retirados de los 4
fixtures taskReadme, per AD-10.
