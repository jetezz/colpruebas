# Design — Regenerar taskReadme de ejemplo a binding SDD v14

- **Task**: `20261001-sdd14-regen-taskreadme-binding-v14` · binding `projectctl-requirements.task-flow` v14.0.0 (`TaskFlowBindingV2`, model `2`)
- **Fase/State**: `fase_2_implementacion` / `p2_planning` · **Lane**: `sdd-design`
- **Proposal ref**: `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/proposal.md` (aprobada, delta vacío con `no_criteria_reason`)
- **Spec ref**: `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/spec.md` (SPEC-01…SPEC-06, listas cerradas)
- **Índice ref**: `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14.md`

> Diseño puramente documental. Ningún comportamiento de producto cambia, ningún criterio
> se añade/modifica/elimina (`criteria-change/v1` vacío + `criteria-links/v1` vacío).
> Esta lane NO ejecuta `projectctl`, `git`, tests, builds ni browser/runtime; solo escribe
> este artifact `design.md`.

## 1. Technical Approach

Enfoque en 5 operaciones estrictamente secuenciales (ver §6 Migración / Rollout para el
orden normativo). Cada operación es idempotente y verificable por lectura de disco +
parseo YAML/JSON, sin comandos de runtime:

1. **Borrado legacy** (destructivo, owner `sdd-orchestrator`, WU-LEGACY-DEL): elimina
   7 ficheros `2026-04-17-test-task-for-state-*` + huérfano `20260728-ff24s9-*` +
   3 incoherentes (`20260706-testtab-*`, `20260825-bhbr8k-*`, `20260913-vn3n31-*`) y sus
   dirs `*/` asociados. Pre-requisito de todo lo demás: mientras existan aliases
   retirados en disco, cualquier validación anti-drift falla.
2. **Recabecerado serie `20260727-p*`** (WU-SERIE-V14, `sdd-apply-doc`): 22 ficheros
   v8→v14 campo-a-campo (SPEC-03-A), sin renombrar paths ni dirs `*/` existentes.
3. **Creación 28 ejemplos canónicos** (WU-EXAMPLES-28, `sdd-apply-doc`): 29 ficheros
   nuevos con convención §2 (decisión separar documentada abajo).
4. **Migración locator + consumidores** (WU-LOCATOR, `sdd-orchestrator` + apply-doc):
   `.agents/sdd-workflow.json` + regeneración `phase-state-schema.json` +
   `.atl/skill-registry.md` + `docs/04-process/task.md` + `AGENTS.md` (condicional).
5. **Verificación documental** (verify lanes si el orchestrator lo exige): revisión de
   diffs contra bloque machine, checks estáticos de lectura, `docs-lint`. Sin tests nuevos.

Rationale del orden: el borrado primero evita falsos positivos de colisión y de
aliases retirados en las validaciones posteriores; el recabecerado antes de la creación
permite aplicar la tabla de deduplicación definitiva (§2.3) con el inventario real en
disco; el locator al final porque su `taskflow:generate` debe correr contra el árbol ya
estable (serie + ejemplos) para que la proyección regenerada sea coherente.

## 2. Architecture Decisions

### AD-01 — Convención de nombres de los 28 ejemplos (sin colisión con serie `20260727-p*`)

**Decisión**: todos los ejemplos nuevos usan `task_id = 20261001-sdd14XX` (rango
`20261001-sdd1401`…`20261001-sdd1429`, ver tabla SPEC-01) y
`slug = ex-<estado-o-control-kebab>` (p. ej. `ex-p1-started`,
`ex-branch-creation-pending`, `ex-done`, `ex-blocked-p2-code-review`).
Fichero: `taskReadme/<task_id>-<task_slug>.md`
(p. ej. `taskReadme/20261001-sdd1401-ex-p1-started.md`).

**Rationale**:
- `binding.task.id_pattern` (`^\d{8}-[a-z0-9]{4,8}$`): `20261001-sdd1401` cumple
  (8 dígitos fecha + sufijo alfanumérico `sdd1401`); la fecha `20261001` (tarea activa)
  es disjunta de la serie `20260727-*`, luego **colisión de `task_id` imposible por
  construcción**, verificable con `ls taskReadme/20261001-sdd14*` vs
  `ls taskReadme/20260727-p*` sin solape.
- `binding.task.slug_pattern` (kebab-case): el prefijo `ex-` (example) es disjunto del
  prefijo `state-` de la serie (`state-p1-started`, …), luego **colisión de nombre de
  fichero imposible** aunque `phase`/`state` coincidan didácticamente.
- Trazabilidad: el sufijo numérico `01`…`29` replica el `#` de SPEC-01-A/B/C/D, de modo
  que `#09 ↔ sdd1409 ↔ p2_code_review` es mecánico de auditar.

Tabla de correspondencia (autoridad: SPEC-01; se repite aquí solo como contrato de
implementación, sin alterar valores literales):

| # | task_id | slug | fichero |
| --- | --- | --- | --- |
| 01–06 | `20261001-sdd1401`…`sdd1406` | `ex-p1-started`…`ex-p1-accepted` | `taskReadme/20261001-sdd1401-ex-p1-started.md` … |
| 07–12 | `20261001-sdd1407`…`sdd1412` | `ex-p2-planning`…`ex-p2-accepted` | `taskReadme/20261001-sdd1407-ex-p2-planning.md` … |
| 13–17 | `20261001-sdd1413`…`sdd1417` | `ex-p3-test-preparing`…`ex-p3-complete` | `taskReadme/…-ex-p3-*.md` |
| 18–22 | `20261001-sdd1418`…`sdd1422` | `ex-p4-started`…`ex-p4-complete` | `taskReadme/…-ex-p4-*.md` |
| 23–26 | `20261001-sdd1423`…`sdd1426` | `ex-branch-creation-pending`, `ex-final-commit-pending`, `ex-final-push-pending`, `ex-final-pr-pending` | 4 ficheros |
| 27 | `20261001-sdd1427` | `ex-done` | `taskReadme/20261001-sdd1427-ex-done.md` |
| 28a/28b | `20261001-sdd1428` / `sdd1429` | `ex-blocked-p2-code-review` / `ex-failed-p3-test-running` | 2 ficheros |

### AD-02 — Resolución del conteo 28 slots vs 29 ficheros: SEPARAR (decisión documentada)

**Decisión**: **separar** — el slot 28 ("par blocked/failed", 1 slot didáctico) se
materializa en **2 ficheros** (28a `blocked` + 28b `failed`). Total: **28 slots
numerados = 29 ficheros materializados** (22 fase + 4 controles + 1 terminal + 2 outcome).

**Rationale**:
- `blocked` y `failed` son dos controles `kind: "outcome"` distintos en
  `binding.controls[]` con `status` distintos (`blocked` vs `failed`) y `preserves:
  ["phase","state"]` cada uno con su propio ejemplo de fase preservada
  (`fase_2_implementacion`/`p2_code_review` vs `fase_3_verificacion`/`p3_test_running`).
  Fusionarlos en 1 fichero obligaría a un frontmatter con un solo `status`, lo que
  **ocultaría un `status.writable` del set de 8** y rompería la cobertura 1:1
  `binding.status.writable` que exige la proposal (success criterion 1).
- La alternativa "fusionar" (1 fichero para el par) queda **rechazada**: solo sería
  aceptable si `sdd-tasks`/orchestrator impusiera límite duro de 28 ficheros, en cuyo
  caso se retiraría el duplicado que indique la tabla §2.3 (nunca alterando los valores
  literales de SPEC-01-D). Sin tal imposición, separar es la forma canónica y es la que
  SPEC-01-D autoriza por defecto.
- Coherencia con índice §2 y proposal Scope-1 ("1 par blocked/failed"): el índice cuenta
  **slots didácticos** (28), no ficheros; `tasks.md` SHALL registrar
  `slots: 28, files: 29` para evitar confusión en verificación.

### AD-03 — Deduplicación serie vs nuevos: los 28 nuevos mandan

**Decisión**: ante igual `phase`/`state` entre un ejemplo nuevo (AD-01) y un fichero de
la serie `20260727-p*` recabecerado, **permanece el nuevo como ejemplo canónico**; el
fichero de serie en colisión se retira vía WU-LEGACY-DEL con inventario previo
(lista + SHA en `tasks.md`), conservando sus dirs `*/` solo si contienen evidencia
que `sdd-orchestrator` decida migrar antes del borrado.

**Rationale**: los nuevos son los únicos con frontmatter v14 nativo + cuerpo de 9
secciones + bloque de origen; la serie recabecerada es compatibilidad histórica, no
canon didáctico. Colisiones conocidas a confirmar en fase 3 (`sdd-tasks` con lectura
de disco): `p1_accepted` (serie `20260727-p1accpt-*` con dir `*/` vs nuevo `sdd1406`),
`p4_reviewing` (serie `20260727-p4review-*` con dir `*/` vs nuevo `sdd1420`), más
cualquier otro solape `phase`/`state` detectado. La tabla definitiva de retirados vive
en `tasks.md` (owner `sdd-orchestrator`), no aquí: este design fija la **regla**, no la
lista final de disco.

### AD-04 — Locator: conservar + migrar, nunca eliminar

**Decisión**: `.agents/sdd-workflow.json` se conserva en su path; solo muta su contenido
(diff §5.3). **Rechazada** la propuesta de eliminarlo.

**Rationale** (heredado de proposal § Approach-4 e índice §8, confirmado contra
proyección vigente `.agents/skills/projectctl-sdd/generated/phase-state-schema.json`
cuyo `source.source_path` ya apunta al satélite SDD v14.0.0): el binding exige
`bootstrap_locator` con cardinalidad `exactly_one` y accessor
`workflow_binding_locator/v1`; `active_sources.include` lista el locator; sin él no hay
`WorkflowRuntimeContextV1.source` válido ni anti-drift. Solo un accessor alternativo
versionado/auditable documentado por el resolver portable autorizaría el retiro; hoy no
existe.

### AD-05 — Sin tests nuevos; verificación documental + checks estáticos

**Decisión**: esta tarea no crea ningún fichero de test (los 28 ejemplos no son
evidencia de cobertura; regla `// @ac` no aplica a taskReadme). Validación = revisión
documental (§7) + checks estáticos de lectura (`sdd-doctor`, `taskflow --check`,
`docs-lint`).

**Rationale**: proposal declara `targets: ["tooling"]` con delta vacío; SPEC-05/SPEC-06
prohíben a las lanes ejecutar `projectctl`/`git`/tests/browser. Añadir tests exigiría
circuito de proposal nuevo con baseline real.

## 3. Data Flow

Flujo de datos (solo lectura/escritura documental, sin runtime):

```
bloque machine `task-flow-binding` v14.0.0
  en .agents/skills/projectctl-sdd/references/tasks/binding.md
        │  (única SoT normativa: phases[] / controls[] / status.writable /
        │   retired_aliases[] / delivery / artifact_store / bootstrap_locator)
        ▼
spec.md (listas cerradas SPEC-01…SPEC-04, valores literales)
        │  (este design no re-deriva valores; solo fija convención + orden + snippets)
        ▼
design.md (este artifact: AD-01…AD-05, orden §6, snippets §5, validación §7)
        ▼
tasks.md (sdd-tasks: 13 columnas + 4 contractuales por WU + inventario SHA pre-borrado
          + tabla deduplicación definitiva + slots:28/files:29)
        ├─► WU-LEGACY-DEL  (orchestrator, apply_lane:none): borra §4.1
        ├─► WU-SERIE-V14   (sdd-apply-doc): recabecera §4.2
        ├─► WU-EXAMPLES-28 (sdd-apply-doc): crea §4.3 (29 ficheros)
        └─► WU-LOCATOR     (orchestrator+apply-doc): migra §4.4 + regenera proyección
              ▼
        verify-*.md (revisión documental §7; sdd-verify-code sobre diffs si se exige)
              ▼
        índice §4/§5/§9 (single-writer orchestrator) → cierre { phase:null, state:done }
```

Persistencia única: índice
`taskReadme/20261001-sdd14-regen-taskreadme-binding-v14.md` (coordinación) + phase
artifacts `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/<artifact>.md`
(detalle). `mirrors: []` — Engram y cualquier herramienta opcional quedan fuera de
recovery/evidencia/cierre.

## 4. File Changes

### 4.1 WU-LEGACY-DEL — Borrado (owner `sdd-orchestrator`, `apply_lane: none`)

| # | Path a eliminar | Motivo |
| --- | --- | --- |
| 1–7 | `taskReadme/2026-04-17-test-task-for-state-done.md`, `-pushing.md`, `-blocked.md`, `-verified.md`, `-ready-for-branch.md`, `-branching.md`, `-failed.md` | Aliases retirados (`branching`, `pushing`, `ready_for_branch`, `verified`, …) como state/status |
| 8 | `taskReadme/20260728-ff24s9-pw-e2e-test-1785240291958/` (dir completo; observado `verify-pwcli.md` + asociados) | Dir huérfano sin índice |
| 9 | `taskReadme/20260706-testtab-test-tab-funcional-colpruebas.md` (+ dir `*/` si existe) | Incoherente |
| 10 | `taskReadme/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests.md` + `taskReadme/20260825-bhbr8k-…/` (17 artifacts) | Incoherente |
| 11 | `taskReadme/20260913-vn3n31-state-test-p1-started.md` (+ dir `*/` si existe) | Incoherente |
| 12* | Retirados por deduplicación AD-03 (lista definitiva en `tasks.md`) | Colisión `phase`/`state` con nuevos |

Pre-condición normativa: inventario (paths + SHA) registrado en `tasks.md` antes de
borrar; rollback = `git checkout develop -- <paths>` por el owner de entrega.
Post-condición: ningún dir `taskReadme/<task_id>-<task_slug>/` huérfano (si cae el
índice, cae su dir). `docs/app-map/**` con 0 diffs.

### 4.2 WU-SERIE-V14 — Recabecerado 22 ficheros `20260727-p*` (`sdd-apply-doc`)

Alcance (observado en disco, 22 + demo `prpdemo`; los dirs `*/` con `proposal.md` /
`apply-*.md` en `p1strt`, `p1xplor`, `p1draft`, `p1await`, `p1revis`, `p1accpt`,
`p2impl`, `p4review` se conservan y NO se renombran):
`20260727-p1strt-*`, `p1xplor-*`, `p1draft-*`, `p1await-*`, `p1revis-*`, `p1accpt-*`,
`p2plan-*`, `p2impl-*`, `p2review-*`, `p2await-*`, `p2revis-*`, `p2accpt-*`,
`p3prep-*`, `p3run-*`, `p3fix-*`, `p3cover-*`, `p3done-*`,
`p4start-*`, `p4doc-*`, `p4review-*`, `p4revis-*`, `p4done-*`
(+ `20260727-prpdemo-*` si `sdd-tasks` lo incluye en alcance).

Mutación campo-a-campo por fichero (autoridad SPEC-03-A; ejemplo real de partida
verificado en `taskReadme/20260727-p1strt-state-p1-started.md`: `binding_version:
"8.0.0"`, `binding_path` fantasma `…/projectctl-requirements/references/tareas.md`,
`branch_name: null`, `pr_url: null`, `blocked_reason: null`, clave intrusa
`error_message: null`, cuerpo v8 `## Purpose`/`## Expected`):
`binding_version → "14.0.0"`; `binding_path → ".agents/skills/projectctl-sdd/references/tasks/binding.md"`;
`branch_name → "feature/<task_id>-<task_slug>"`; `pr_url → ""`; `blocked_reason → ""`;
REMOVED `error_message`; cuerpo reescrito a 9 secciones v14 con ownership
`sdd-orchestrator` + bloque de origen v14. `status`/`phase`/`state` preservados
(revalidados: `status` = status de su fase).

### 4.3 WU-EXAMPLES-28 — Creación 29 ficheros nuevos (`sdd-apply-doc`)

Crear `taskReadme/20261001-sdd1401-ex-p1-started.md` … `taskReadme/20261001-sdd1429-ex-failed-p3-test-running.md`
según tabla AD-01 (29 ficheros, `slots: 28, files: 29`). Cada fichero: frontmatter
literal §5.1 con sus valores `phase`/`state`/`status` de SPEC-01 + cuerpo de 9
secciones v14 con ownership + bloque de origen + nota didáctica del `kind`
(`phase-state` / `action` con `writes_state: true` / `terminal` / `outcome` con
`writes_state: false` + `preserves`). Los 4 controles y el par outcome documentan
`kind`/`writes_state`/`owner` en cuerpo (no en frontmatter).

### 4.4 WU-LOCATOR — Migración locator + proyección + 3 consumidores

- `.agents/sdd-workflow.json`: diff §5.3 (contenido; mismo path).
- `.agents/skills/projectctl-sdd/generated/phase-state-schema.json`: regenerar tras el
  locator (su `source` ya declara `binding_version: 14.0.0` y `source_path` SDD; la
  regeneración fija `generated_at`/`source_sha256` vigentes) + checks verdes.
- `.atl/skill-registry.md` (fila `projectctl-requirements/tareas`, hoy
  `.agents/skills/projectctl-requirements/references/tasks/binding.md`): apuntar al
  satélite SDD v14.0.0.
- `docs/04-process/task.md` (6 ocurrencias verificadas: pins `v10.0.0` + path fantasma
  `projectctl-requirements/references/tasks/binding.md`): pasar a `v14.0.0` + path SDD,
  sin publicar lista propia de fases/estados/lanes/gates.
- `AGENTS.md`: solo si pinea versión → `14.0.0`; si no pinea, no tocar.

### 4.5 No tocados

`docs/app-map/**` (solo lectura, 0 diffs), `frontend/`, `backend/`/`api/`, `shared/`,
`tests/`, `scripts/`, `compose/`, superficies prohibidas
(`proposals/**`, `specs/**`, `designs/**`, `tasks/**`, `openspec/**`, …), mirrors
(`[]`), el índice (single-writer `sdd-orchestrator`), rama/PR (propiedad orchestrator).

## 5. Interfaces / Contracts

### 5.1 Snippet literal — frontmatter plantilla v14 (base de todo ejemplo nuevo y recabecerado)

Copiado byte-fiel de `.agents/skills/projectctl-sdd/assets/task-template.md` v14
(claves normativas; los ejemplos sustituyen solo los valores marcados):

```yaml
---
title: "<Nombre claro de la tarea>"
task_id: "<YYYYMMDD-shortid>"
task_slug: "<kebab-case-slug>"
sdd_change_id: ""
binding_id: "projectctl-requirements.task-flow"
binding_version: "14.0.0"
binding_path: ".agents/skills/projectctl-sdd/references/tasks/binding.md"
sdd_persistence: "taskReadme index + phase artifacts"
phase_artifacts_dir: "taskReadme/<task_id>-<task_slug>/"
status: planning
phase: fase_1_propuesta
state: p1_started
priority: medium
type: feature
area: fullstack
created: 2026-10-01T00:00:00Z
updated: 2026-10-01T00:00:00Z
source_branch: develop
target_branch: develop
branch_name: "feature/<task_id>-<task_slug>"
pr_url: ""
browser_validation: required
docker_validation: required
docs_impact: pending
blocked_reason: ""
---
```

Reglas de sustitución (contrato): `task_id`/`task_slug`/`title`/`phase_artifacts_dir`/
`branch_name` por ejemplo; `status`/`phase`/`state` según tabla SPEC-01 (nunca
`error_message`, nunca `null` en `branch_name`/`pr_url`/`blocked_reason`, nunca claves
fuera de plantilla).

### 5.2 Snippet literal — ejemplo terminal `done` con `phase: null` real (fichero #27)

`taskReadme/20261001-sdd1427-ex-done.md` — `phase: null` es YAML null **sin comillas**
(el string `"null"` es drift y SHALL rechazarse):

```yaml
---
title: "Ejemplo terminal done"
task_id: "20261001-sdd1427"
task_slug: "ex-done"
sdd_change_id: ""
binding_id: "projectctl-requirements.task-flow"
binding_version: "14.0.0"
binding_path: ".agents/skills/projectctl-sdd/references/tasks/binding.md"
sdd_persistence: "taskReadme index + phase artifacts"
phase_artifacts_dir: "taskReadme/20261001-sdd1427-ex-done/"
status: done
phase: null
state: done
priority: medium
type: feature
area: fullstack
created: 2026-10-01T00:00:00Z
updated: 2026-10-01T00:00:00Z
source_branch: develop
target_branch: develop
branch_name: "feature/20261001-sdd1427-ex-done"
pr_url: ""
browser_validation: required
docker_validation: required
docs_impact: pending
blocked_reason: ""
---
```

Cuerpo del #27 SHALL declarar: `kind: "terminal"`, `writes_state: true`,
`owner: "sdd-orchestrator"`, sin transiciones, forma única
`{ phase: null, state: "done", status: "done" }`.

### 5.3 Snippet literal — ejemplo `blocked` con `phase`/`state` preservados (fichero 28a)

`taskReadme/20261001-sdd1428-ex-blocked-p2-code-review.md` — `status: blocked` es el
outcome; `phase`/`state` conservan el estado de fase interrumpido:

```yaml
---
title: "Ejemplo blocked en p2_code_review"
task_id: "20261001-sdd1428"
task_slug: "ex-blocked-p2-code-review"
sdd_change_id: ""
binding_id: "projectctl-requirements.task-flow"
binding_version: "14.0.0"
binding_path: ".agents/skills/projectctl-sdd/references/tasks/binding.md"
sdd_persistence: "taskReadme index + phase artifacts"
phase_artifacts_dir: "taskReadme/20261001-sdd1428-ex-blocked-p2-code-review/"
status: blocked
phase: fase_2_implementacion
state: p2_code_review
priority: medium
type: feature
area: fullstack
created: 2026-10-01T00:00:00Z
updated: 2026-10-01T00:00:00Z
source_branch: develop
target_branch: develop
branch_name: "feature/20261001-sdd1428-ex-blocked-p2-code-review"
pr_url: ""
browser_validation: required
docker_validation: required
docs_impact: pending
blocked_reason: "Ejemplo didactico: interrupcion preservando phase/state."
---
```

Cuerpo del 28a SHALL declarar: `kind: "outcome"`, `writes_state: false`,
`owner: "sdd-orchestrator"`, `preserves: ["phase", "state"]`.
(28b es simétrico: `status: failed`, `phase: fase_3_verificacion`,
`state: p3_test_running`, slug `ex-failed-p3-test-running`.)

### 5.4 Snippet literal — diff del locator `.agents/sdd-workflow.json` (antes → después)

Estado actual verificado en disco (inválido: path fantasma + `10.0.0` + proyecciones
fantasma). WU-LOCATOR aplica exactamente este diff (mismo path, solo contenido):

```diff
 {
   "contract_version": 2,
-  "binding_path": ".agents/skills/projectctl-requirements/references/tasks/binding.md",
+  "binding_path": ".agents/skills/projectctl-sdd/references/tasks/binding.md",
   "machine_block_id": "task-flow-binding",
   "expected_binding_id": "projectctl-requirements.task-flow",
-  "expected_binding_version": "10.0.0",
+  "expected_binding_version": "14.0.0",
   "projections": {
-    "state_model": ".agents/skills/projectctl-requirements/generated/phase-state-schema.json",
-    "task_template": ".agents/skills/projectctl-requirements/assets/task-template.md",
+    "state_model": ".agents/skills/projectctl-sdd/generated/phase-state-schema.json",
+    "task_template": ".agents/skills/projectctl-sdd/assets/task-template.md",
     "client_view_model": "frontend/src/views/projectctl/data/tareas-tab.view-model.ts",
     "client_generated_ts": "frontend/src/shared/sdd/task-flow.generated.ts"
   }
 }
```

`contract_version` / `machine_block_id` / `expected_binding_id` sin cambio.
`client_view_model` / `client_generated_ts` sin cambio en esta fase (verificar
existencia en fase 3; si no existen, `tasks.md` propone tratamiento sin inventar
accessor alternativo).

## 6. Migration / Rollout

Orden normativo (secuencial, sin paralelismo entre WUs; el paralelismo solo existe
*dentro* de cada WU doc por fichero, todos `parallel-safe` al ser paths disjuntos):

| Paso | WU | Owner / lane | Pre-condición | Post-condición verificable |
| --- | --- | --- | --- | --- |
| 1 | WU-LEGACY-DEL (borrado §4.1) | `sdd-orchestrator`, `apply_lane: none` | Inventario paths+SHA en `tasks.md` | `ls` confirma ausencia de los 11 paths + dirs; `grep retired_alias` en `taskReadme/` = 0 |
| 2 | WU-SERIE-V14 (recabecerado §4.2) | `sdd-apply-doc` | Paso 1 done | 22 frontmatter con `binding_version: "14.0.0"`, sin `error_message`, `branch_name: feature/…` |
| 3 | WU-EXAMPLES-28 (creación §4.3) | `sdd-apply-doc` | Paso 2 done + regla AD-03 | 29 ficheros `20261001-sdd14*` parsean YAML; `slots: 28, files: 29` |
| 4 | WU-LOCATOR (migración §4.4) | `sdd-orchestrator` + apply-doc | Pasos 1–3 done | Locator diff §5.4 aplicado; proyección regenerada; 0 ocurrencias `10.0.0` / path fantasma en los 3 consumidores |
| 5 | Verificación documental §7 | verify lanes (si se exige) | Paso 4 done | `verify-*.md` + semáforo de cierre; `docs/app-map/**` 0 diffs |

Rollback por paso: paso 1 → `git checkout develop -- <paths>` (owner entrega);
pasos 2–4 → re-apply del frontmatter/contenido previo guardado en
`apply-<unit_id>.md`; si el locator migrado rompe resolución → restaurar JSON previo
(aunque inválido) y re-bloquear con warning crítico en índice §8; nunca dejar el path
ausente. Rama `feature/20261001-sdd14-regen-taskreadme-binding-v14` desde `develop` +
PR único: propiedad exclusiva de `sdd-orchestrator` (rama aún no creada → bloqueado
hasta `branch_creation_pending`); esta lane no la crea.

## 7. Testing Strategy

Estrategia de validación **documental + estática**, sin tests nuevos (AD-05):

1. **Extracción del bloque machine**: leer el bloque delimitado `task-flow-binding`
   (`TaskFlowBindingV2`) en
   `.agents/skills/projectctl-sdd/references/tasks/binding.md` como SoT de
   `phases[]` / `controls[]` / `status.writable` (8) / `retired_aliases[]`.
   Cada frontmatter creado/recabecerado SHALL validarse por lectura contra ese bloque:
   `status ∈ writable`, `phase`/`state ∈ phases[] ∨ controls[].value`,
   `status` = status de su fase (SPEC-01-A), controles copiando `value` literal
   (SPEC-01-B), terminal `{ null, done, done }` con null real (SPEC-01-C), outcomes con
   `phase`/`state` preservados + `writes_state: false` en cuerpo (SPEC-01-D).
2. **`sdd-check`** (`bun scripts/sdd-doctor.ts`): preflight verde ya evidenciado en
   bootstrap; re-ejecutar tras WU-LOCATOR (owner orchestrator/verify, no esta lane).
3. **`taskflow check`** (`bun scripts/taskflow.ts --check` + `taskflow:generate` tras
   regenerar `phase-state-schema.json`): verdes; editar locator sin regenerar
   proyección = drift bloqueante.
4. **`docs-lint`** (`bun scripts/projectctl-docs.ts lint`): verde sobre docs tocados
   (`.atl/skill-registry.md`, `docs/04-process/task.md`, `AGENTS.md` si aplica).
5. **Barridos de drift por lectura**: ningún artifact contiene valor de
   `retired_aliases[]` como `status`/`phase`/`state`/owner/lane; ningún ejemplo usa
   `"null"` entrecomillado; `pending` + `p1_started` rechazado (`pending` es
   `pre_bootstrap`, `p1_started` exige `planning`); índice respeta `index_budget`
   (`max_lines: 400`, `max_phase_summary_lines: 10`); persistencia = índice + phase
   artifacts con `mirrors: []`; `docs/app-map/**` 0 diffs.

Ninguna lane de esta tarea ejecuta `projectctl`, `git`, tests, builds ni
browser/runtime. Los gates contractuales (`bun run test:check`, `// @ac`) aplican al
repo pero esta tarea no crea tests; si fase 3+ detecta necesidad, se abre circuito con
proposal que los autorice.

## 8. Backend impact analysis

**Sin impacto de backend, frontend, datos ni runtime.** Superficie tocada: SDD
documental (`taskReadme/`, `.agents/sdd-workflow.json`,
`.agents/skills/projectctl-sdd/generated/phase-state-schema.json`,
`.atl/skill-registry.md`, `docs/04-process/task.md`, `AGENTS.md` condicional).
No se tocan `frontend/`, `backend/`/`api/`, `shared/`, `tests/`, `scripts/`,
`compose/`, bundles ni `navigation.yaml`; no hay migraciones, cambios de API,
esquema, contratos ni variables de entorno; excluidos de commit
(`.env`, `.env.dev`, `.runtime/`, `frontend/test-results/`) no se tocan (firma
commitada: `.env.example`); sin secretos. Todos los paths tocados son commitables por
flujo normal; sin `force-add` previsto — si aparece un path generado inesperado, se
reporta a `sdd-orchestrator` como `policy review required`. Riesgo residual: borrado
destructivo (mitigado con inventario SHA + rollback por checkout) y proyección
desincronizada (mitigada con regeneración + generate verde en WU-LOCATOR).

## 9. Open Questions

1. **Deduplicación definitiva**: colisiones conocidas (`p1_accepted`, `p4_reviewing`)
   confirmadas por lectura, pero el solape total serie-vs-nuevos solo se cierra con el
   árbol post-paso-1. ¿Confirma `sdd-tasks` la tabla definitiva de retirados con SHA
   antes de autorizar WU-LEGACY-DEL extendido? (Propuesta: sí; owner orchestrator.)
2. **Proyecciones cliente** (`client_view_model`, `client_generated_ts`): existen como
   claves pero su existencia en disco no se verificó en esta lane (fuera de autoridad:
   sin shell). ¿Verifica `sdd-tasks` su existencia y fija tratamiento (mantener vs
   retirar clave) sin inventar accessor? (Propuesta: verificar; no inventar.)
3. **Límite 28 vs 29**: si el orchestrator impusiera exactamente 28 ficheros,
   ¿qué duplicado de la tabla §2.3 se retira (propuesta: el de serie, nunca el nuevo)?
   Decisión por defecto de este design: separar (29 ficheros); fusión solo bajo orden
   explícita.
4. **Verify lanes exigidas**: ¿exige el orchestrator `sdd-verify-code` sobre los diffs
   doc, o basta revisión documental + checks estáticos §7? (Propuesta: revisión +
   checks; verify-code solo si el gate documental lo pide.)
5. **`AGENTS.md`**: ¿pinea versión de binding? Si no, no se toca (SPEC-04-B-3). A
   confirmar por `sdd-tasks` con cita literal de la línea.
6. **Demo `20260727-prpdemo-*`**: ¿entra en WU-SERIE-V14 (recabecerar) o en
   WU-LEGACY-DEL (retirar por ser demo)? A decidir en `tasks.md` con inventario.

---
*Teams backend / frontend / UL — send to verification agent for review.*
