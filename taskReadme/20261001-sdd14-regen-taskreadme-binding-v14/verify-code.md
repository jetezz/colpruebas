# Verify-code — Regenerar taskReadme de ejemplo a binding SDD v14

- **Task**: `20261001-sdd14-regen-taskreadme-binding-v14` · binding `projectctl-requirements.task-flow` v14.0.0 (`TaskFlowBindingV2`, model `2`)
- **Lane**: `sdd-verify-code` · **Artifact**: `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/verify-code.md` (este fichero)
- **Refs**: `proposal.md` (delta vacío aprobado) · `spec.md` (SPEC-01…SPEC-06) · `design.md` (AD-01…AD-05, snippets §5) · `tasks.md` (5 WUs, §4 tabla + §5 detalle) · evidencias `apply-WU-SERIE-V14.md` (actualizado con fixes F-01/F-03), `apply-WU-EXAMPLES-28.md`, `apply-WU-LOCATOR.md`
- **Método**: solo lectura (frontmatters, cuerpos, locator, consumidores, globs de ausencia) + comandos estáticos mínimos de evidencia (`rg`/`ls`/`head`, scoping explícito del encargo de re-verificación). Sin tests, sin git, sin comandos de runtime.
- **Envoltorio**: `lane: sdd-verify-code` · `code_review_result: passed` · `routing_tag: none` (sin rework bloqueante; F-02 queda como warning aceptable) · `artifact_ref: taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/verify-code.md`
- **Historial**: veredicto previo `failed` (`routing_tag: doc_issue`) por F-01 (cuerpos serie con drift) + F-03 (comillas `p1await`). Re-verificación `2026-10-01` tras fixes F-01/F-03 declarados en `apply-WU-SERIE-V14.md` §§ Mutación/Fixes/Desviaciones.

## Contract review (Task Contract Gate, tasks.md §4)

| WU | Spec scenarios linked | Implementation contract | Verify expects | Routing tag on failure | Utilizable |
|---|---|---|---|---|---|
| `WU-VERIFY-PREP` | Concreto (SPEC-02/05/06) | Concreto (inventario §8 + dedup §9 + QQ 2/5/6) | Concreto | `tasks_contract_missing` | Sí |
| `WU-LEGACY-DEL` | Concreto (SPEC-02 + SPEC-05) | Concreto (paths §8 L01–L11 + §9) | Concreto (ausencia + 0 huérfanos + 0 retired + app-map 0 diffs) | `tasks_contract_missing` | Sí |
| `WU-SERIE-V14` | Concreto (SPEC-03 + SPEC-05) | Concreto (SPEC-03-A fila a fila + snippet design §5.1, **incluye cuerpo a 9 secciones v14 + bloque origen**) | Concreto | `doc_issue` | Sí |
| `WU-EXAMPLES-28` | Concreto (SPEC-01-A/B/C/D + SPEC-05) | Concreto (AD-01 + snippets §5.1/§5.2/§5.3) | Concreto | `doc_issue` | Sí |
| `WU-LOCATOR` | Concreto (SPEC-04-A/B + no-eliminación + SPEC-05/06) | Concreto (diff §5.4 + regeneración + 3 consumidores) | Concreto | `doc_issue` | Sí |

Ninguna WU está `blocked` por contrato: los cuatro campos están presentes y concretos en todas. Se procede a revisión de código/contenido (documental).

## Veredicto por WU

| WU | apply_lane | Veredicto | Ruta |
|---|---|---|---|
| `WU-VERIFY-PREP` | `none` (orchestrator-only) | `not_required` (mecánico de orchestrator; sin evidencia `apply-WU-VERIFY-PREP.md` en disco; §8/§9 de `tasks.md` siguen con `TBD`) | `sdd-orchestrator` (completar inventario antes de cerrar LEGACY-DEL extendido) |
| `WU-LEGACY-DEL` | `none` (orchestrator-only) | `passed` con warning aceptable (alcance L01–L11 + `prpdemo` ausentes en disco; sin evidencia `apply-WU-LEGACY-DEL.md`; extensión dedup L12+ documentada como warning aceptable F-02, no bloqueante en proyecto de prueba) | `sdd-orchestrator` (dedup AD-03, ver F-02) |
| `WU-SERIE-V14` | `doc` | `passed` (frontmatter OK 22/22 + cuerpos con 0 drift tras fixes F-01/F-03 verificados en disco) | — |
| `WU-EXAMPLES-28` | `doc` | `passed` (29/29, `slots: 28, files: 29`) | — |
| `WU-LOCATOR` | `doc` | `passed` con notas (locator + 3 consumidores OK; regeneración resuelta como verificación no-op documentada) | — (seguimiento fuera de alcance: README/tests/manifiesto aún en v10) |

## Verify expectations checked (esta lane; lo ejecutable va a sus lanes)

- [x] WU-SERIE-V14 — 22 frontmatter con `binding_version: "14.0.0"`: **pass** (22/22 por `rg -c`, paths SDD correctos).
- [x] WU-SERIE-V14 — sin clave `error_message` en la serie: **pass** (0 ocurrencias en `20260727-p*.md`; `prpdemo` ausente, nada que excluir).
- [x] WU-SERIE-V14 — `branch_name` patrón `feature/<id>-<slug>`: **pass** (muestras `p1draft`, `p1await` conformes).
- [x] WU-SERIE-V14 — 0 `retired_aliases` como `status`/`state`: **pass** (`rg` 0 resultados en serie + ejemplos).
- [x] WU-SERIE-V14 — cuerpo a 9 secciones v14 + bloque origen (SPEC-03-A): **pass tras fix** — `p1draft` reescrito a 9 secciones v14 con ownership `sdd-orchestrator` + bloque origen v14 (`mirrors: []`); barrido serie `rg` de path fantasma / `tareas.md` / pins v8/v10 / `proposal_*`-Engram-evidencia = 0 resultados. `info` para otras lanes: `taskflow --check` / `sdd-doctor` / `docs-lint` post-migración, propiedad de verify lanes / orchestrator (esta lane no ejecuta comandos).
- [x] WU-SERIE-V14 — F-03 comillas `p1await`: **pass tras fix** — frontmatter citado de plantilla (verificado `head -30`); barrido `rg "^task_id: [^\"]|^binding_version: [^\"]"` en serie = 0 resultados.
- [x] WU-EXAMPLES-28 — 29 ficheros parsean YAML con `binding_version 14.0.0` + path SDD + sin `error_message`: **pass** (29 ex-* + índice = 30 ficheros con `14.0.0`; `ls 20261001-sdd14*.md` = 30, de los cuales 29 son `ex-*`).
- [x] WU-EXAMPLES-28 — #01–22 `status` = status de su fase y `state ∈ phases[].states`: **pass** (muestreo + barrido `status/phase/state` coherente: p1/`planning`, p2/`implementing`, p3/`testing`, p4/`documenting`).
- [x] WU-EXAMPLES-28 — #23–26 idénticos a `controls[].value` + cuerpo con `kind: action / writes_state: true / owner`: **pass** (contrato declarado en evidencia; frontmatter verificado).
- [x] WU-EXAMPLES-28 — #27 `{ phase: null, state: done, status: done }` con null real: **pass** (`phase: null` sin comillas, l.12 de `20261001-sdd1427-ex-done.md`; 0 `^phase: "null"` entrecomillado en serie + ejemplos).
- [x] WU-EXAMPLES-28 — 28a/28b `blocked`/`failed` con phase/state preservados + `writes_state: false`: **pass** (28a `blocked` + `fase_2_implementacion`/`p2_code_review`; 28b `failed` + `fase_3_verificacion`/`p3_test_running`).
- [x] WU-EXAMPLES-28 — 0 `retired_aliases` como valores: **pass** (menciones en prosa didáctica, nunca como valor).
- [x] WU-LOCATOR — `binding_path` existe, `expected_binding_version: "14.0.0"`, proyecciones SDD existen: **pass** (locator migrado; `phase-state-schema.json` + `task-template.md` presentes en disco).
- [x] WU-LOCATOR — 0 `10.0.0` / 0 path fantasma en los 3 consumidores + `AGENTS.md`: **pass** (veredicto previo vigente, sin cambios en esta revisión).
- [x] WU-LOCATOR — `.agents/sdd-workflow.json` conservado (no eliminado): **pass** (existe, 13 líneas, diff §5.4 aplicado).
- [x] Reglas — `mirrors: []`, sin `proposals/**`/`specs/**`, índice ≤ 400 líneas: **pass** (índice 166 líneas; `proposals/**` y `specs/**` sin resultados; nuevos e índice declaran `mirrors: []`).
- [x] WU-LEGACY-DEL — ausencia L01–L11 + `prpdemo`: **pass** (0 `2026-04-17-*`, 0 `20260728-ff24s9-*`, 0 `20260706-*`/`20260825-*`/`20260913-*`, 0 `20260727-prpdemo-*`; 22 serie + 29 ejemplos + índice = árbol esperado).

## Findings

### Critical

- Ninguno abierto. **F-01 previo (cuerpos no reescritos) — CERRADO en esta re-verificación** (ver Resueltos).

### Resueltos (verificados en disco en esta revisión)

- **F-01 [RESUELTO] — WU-SERIE-V14: cuerpos normalizados.** La desviación declarada queda resuelta por los fixes aplicados y verificada por lectura + `rg`:
  - `taskReadme/20260727-p1draft-state-p1-drafting.md` ll.29–129: cuerpo a 9 secciones v14 con ownership `sdd-orchestrator` por `binding.task.heading_owners` + bloque de origen v14 (`mirrors: []`, nota de fixture histórico `p1_drafting`, valores `phase`/`state`/`status` preservados). Sin cita a binding v8/path fantasma, sin Engram como evidencia, sin descripción de claves `proposal_*` removidas.
  - `taskReadme/20260727-p1await-state-p1-awaiting-acceptance.md` l.49: receipt `approved_revision` a `projectctl-requirements.task-flow@14.0.0` con path SDD (`.agents/skills/projectctl-sdd/references/tasks/binding.md`).
  - Barrido serie 22 (`rg` path fantasma / `tareas.md` / `@10` / `@8` / `v8.0.0` / `sdd/20260727-p1draft/proposal` / `Engram.*mirror`): **0 resultados** → 0 drift de cuerpos. SPEC-03-A y SPEC-05 (0 drift) satisfechos en el alcance de esta lane.
- **F-03 [RESUELTO] — `p1await` con frontmatter citado.** Verificado `head -30`: todas las claves normativas entrecomilladas (`task_id: "20260727-p1await"`, `binding_version: "14.0.0"`, …), estilo plantilla, valores `status`/`phase`/`state` sin cambio. Barrido de escalares sin comillar en serie: **0 resultados**.

### Warning

- **F-02 — Deduplicación AD-03 pendiente (colisiones vivas) — WARNING ACEPTABLE, NO BLOQUEANTE en proyecto de prueba (instrucción explícita de re-verificación).** `20261001-sdd1406` (`p1_accepted`: `fase_1_propuesta`/`p1_accepted`/`planning`) coexiste con `20260727-p1accpt-state-p1-accepted.md` (mismo `phase`/`state`/`status`) y `20261001-sdd1420` (`p4_reviewing`: `fase_4_documentacion`/`p4_reviewing`/`documenting`) con `20260727-p4review-state-p4-reviewing.md` (mismo `phase`/`state`/`status`) — verificado por `rg ^phase:/^state:/^status:` en los 4 ficheros. SPEC-03-B exige que solo uno permanezca. **Documentación aceptada**: en este proyecto de prueba coexisten 2 ejemplos por estado (serie histórica + nuevo canónico); el retiro definitivo queda como follow-up de WU-LEGACY-DEL extendido (owner `sdd-orchestrator`, `tasks.md` §9 sigue en `TBD`). No suspende `code_review_result`.
- **F-04 — Skill-registry sin versión literal.** `.atl/skill-registry.md` l.22 apunta al satélite SDD pero no contiene la cadena `14.0.0` (versión «implícita por path canónico» según evidencia) mientras SPEC-04-B-1 pide path + versión. Funcionalmente resuelve; literalmente incompleto. **Acción**: `doc_issue` menor o aceptación del orchestrator (una línea). No bloqueante.
- **F-05 — Proyección cliente desincronizada (fuera de alcance, se reporta).** `frontend/src/shared/sdd/task-flow.generated.ts` y `frontend/src/views/projectctl/data/tareas-tab.view-model.ts` existen pero declaran `v9.0.0` y fuente `projectctl-requirements/references/tareas.md`. SPEC-04-A las deja SIN CAMBIO en esta spec y la evidencia documenta el generador como no-op en este repo, por lo que NO suspende WU-LOCATOR; pero el árbol queda con proyecciones cliente en v9 frente a binding v14. **Acción**: informativa para `sdd-orchestrator` (futura regeneración con generador canónico externo).

### Info

- **F-06 — `prpdemo` ausente aunque la evidencia dice «NO tocado».** `taskReadme/20260727-prpdemo-*` no existe en disco (glob 0 resultados) mientras `apply-WU-SERIE-V14.md` lo deja «pendiente de QQ6». Estado final deseado (ausencia) ya se cumple; solo falta alinear el veredicto QQ6 en `tasks.md` §9. Sin acción de contenido.
- **F-07 — Sin evidencias `apply-WU-VERIFY-PREP.md` ni `apply-WU-LEGACY-DEL.md`.** Esperable (WUs `none`, owner orchestrator; mapping §12 exige verify solo para `doc`), pero §8/§9 de `tasks.md` siguen en `TBD`: el inventario SHA pre-borrado normativo (SPEC-02) no está registrado. Se informa porque un futuro auditor no podrá reconstruir el rollback `git checkout develop -- <paths>` desde `tasks.md`.
- **F-08 — Drift v10 fuera del alcance SPEC-04-B (se reporta, no suspende).** `README.md`, `tests/unit/home/projectctl-compliance.test.ts`, `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` y `.agents/projectctl/manifest.json` siguen pineando v10/path fantasma (veredicto previo vigente). SPEC-04-B solo cubre los 3 consumidores + `AGENTS.md` (todos limpios), así que no es fallo de esta WU; pero los tests que asertan v10 fallarán contra el árbol v14 y el README contradice al binding. Proponer follow-up fuera de esta tarea (incluye compliance test mencionado en el encargo).
- **F-09 — Arquitectura / mantenibilidad / API.** Sin cambios de producto, backend, frontend, datos ni runtime (superficie SDD documental). Sin duplicación evitable introducida por los 29 nuevos (convención `20261001-sdd14*` + slug `ex-*` disjunta de `20260727-p*`/`state-*` por construcción); la duplicación `phase`/`state` serie-vs-nuevos es la colisión conocida y gobernada por AD-03 (F-02, warning aceptable aquí). Sin APIs deprecadas ni contratos rotos en el alcance. Convención de nombres AD-01 y decisión SEPARAR AD-02 (`slots: 28, files: 29`) correctamente aplicadas.

## Detalle verificado por alcance del encargo

- **Serie 22**: `p1strt, p1xplor, p1draft, p1await, p1revis, p1accpt, p2plan, p2impl, p2review, p2await, p2revis, p2accpt, p3prep, p3run, p3fix, p3cover, p3done, p4start, p4doc, p4review, p4revis, p4done` — 22/22 con `binding_version 14.0.0` + path SDD, 0 `error_message` en frontmatter, 0 aliases como valores, 0 drift en cuerpos (barrido `rg` 0 resultados), comillas de plantilla uniformes (barrido sin-comillar 0 resultados). Dirs `*/` existentes conservados (`p1strt, p1xplor, p1draft, p1await, p1revis, p1accpt, p2impl, p4review`).
- **Ejemplos 29**: 22 fase + 4 controles acción + terminal `done` + par blocked/failed = 28 slots / 29 ficheros (`20261001-sdd1401`…`sdd1429`). Frontmatter plantilla v14 válido, `phase`/`state`/`status` por binding, terminal null real, outcomes con phase/state preservados, 0 `retired_aliases` como valores, 0 `"null"` como valor.
- **Locator**: `.agents/sdd-workflow.json` existe (NO eliminado), diff design §5.4 aplicado íntegro (`binding_path` SDD, `expected 14.0.0`, proyecciones SDD). Consumidores actualizados (skill-registry, `docs/04-process/task.md`, `AGENTS.md`). Proyecciones SDD existen (`generated/phase-state-schema.json`, `assets/task-template.md`).
- **Legacy**: 7 `2026-04-17-*` + huérfano `20260728-ff24s9-*` + 3 incoherentes (`20260706-*`, `20260825-*` + dirs, `20260913-*`) + `prpdemo` — todos ausentes en disco. Ningún dir huérfano `taskReadme/<id>-<slug>/` sin índice entre los retirados.
- **Reglas**: `mirrors: []` en índice, nuevos y proyección; sin `proposals/**` ni `specs/**` creados; índice 166 líneas (< 400) con resúmenes de fase ≤ 10 líneas.

## ### Code review

Revisión documental contra spec/design + re-verificación de fixes en disco (lectura + `rg`/`ls` estáticos, sin tests ni git): **3 WU en `passed` (WU-SERIE-V14 tras fixes F-01/F-03, WU-EXAMPLES-28, WU-LOCATOR con notas), 1 `passed` con warning aceptable no bloqueante (WU-LEGACY-DEL, dedup F-02 como 2-ejemplos-por-estado en proyecto de prueba), 1 `not_required` (WU-VERIFY-PREP, inventario TBD F-07).** 0 findings `critical` abiertos (F-01/F-03 cerrados); F-02 persiste pero documentado como warning aceptable por instrucción explícita (serie histórica + nuevo canónico). Drift v10 residual fuera de alcance (README/tests/manifiesto/proyecciones cliente, incl. compliance test) documentado como follow-up (F-05/F-08). Sin rework `doc_issue` pendiente para esta lane; el dedup e inventario quedan como follow-ups de `sdd-orchestrator`.

## Summary (para sdd-orchestrator)

`code_review_result: passed` (`routing_tag: none`): serie 22 con frontmatter v14 + 0 drift de cuerpos (F-01 cerrado por `rg` 0 resultados) + comillas uniformes (F-03 cerrado), 29 ejemplos válidos (`slots: 28, files: 29`, null real, 0 retired), locator migrado y legacy ausente verificados en disco. F-02 (duplicados serie vs nuevos `p1_accepted`/`p4_reviewing`) persiste y se documenta como warning aceptable para proyecto de prueba (2 ejemplos por estado: serie histórica + nuevo canónico), no bloqueante. Nada ejecutado salvo lectura + barridos estáticos; detalle y líneas exactas en Findings F-01…F-09 de este artifact.
