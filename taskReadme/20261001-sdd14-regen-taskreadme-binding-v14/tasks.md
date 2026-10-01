# Tasks — Regenerar taskReadme de ejemplo a binding SDD v14

- **Task**: `20261001-sdd14-regen-taskreadme-binding-v14` · binding `projectctl-requirements.task-flow` v14.0.0 (`TaskFlowBindingV2`, model `2`)
- **Fase/State**: `fase_2_implementacion` / `p2_planning` · **Lane**: `sdd-tasks`
- **Proposal ref**: `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/proposal.md` (aprobada, delta vacío con `no_criteria_reason` mecánico-documental)
- **Spec ref**: `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/spec.md` (SPEC-01…SPEC-06, listas cerradas)
- **Design ref**: `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/design.md` (AD-01…AD-05, orden §6, snippets §5)
- **Índice ref**: `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14.md` (coordinación; single-writer `sdd-orchestrator`, esta lane NO lo escribe)
- **Artifact**: `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/tasks.md` (este fichero; única escritura de esta lane)

> Desglose puramente documental. Ningún comportamiento de producto cambia, ningún criterio
> se añade/modifica/elimina. La definición vigente de criterios vive en los bundles App Map
> propietarios; este artifact no crea AC locales ni otro catálogo. Sin shell/runtime/tests/
> Git/GitHub/browser por esta lane: solo escritura de `tasks`.

```criteria-links/v1
{
  "criteria": [],
  "units": [
    {"id": "WU-VERIFY-PREP", "criterion_ids": [], "scenario_ids": [], "mechanical": true},
    {"id": "WU-LEGACY-DEL", "criterion_ids": [], "scenario_ids": [], "mechanical": true},
    {"id": "WU-SERIE-V14", "criterion_ids": [], "scenario_ids": [], "mechanical": true},
    {"id": "WU-EXAMPLES-28", "criterion_ids": [], "scenario_ids": [], "mechanical": true},
    {"id": "WU-LOCATOR", "criterion_ids": [], "scenario_ids": [], "mechanical": true}
  ]
}
```

- El fence `criteria-links/v1` es único en este artifact y enumera exactamente el conjunto
  canónico aprobado por la proposal: conjunto vacío (`criteria: []`, coherente con
  `criteria-change/v1` vacío + `no_criteria_reason` no vacío de `proposal.md` y con
  `criteria-links/v1` vacío de `spec.md`).
- Los 8 IDs leídos como contexto (`HOME-01`, `HOME-05`, `HSS-01`…`HSS-04`, `HRM-01`, `HRM-02`)
  siguen **mantenidos fuera del fence**: ningún escenario ni unidad los cita como cobertura.
- Todas las unidades llevan `criterion_ids: []` + `scenario_ids: []` + `mechanical: true`
  porque el conjunto aprobado es vacío: ninguna unidad sustituye la implementación de un
  criterio. Los `scenario_ids` del fence son los links criterio→escenario (vacíos por
  delta vacío); los escenarios de verificación SPEC-01…SPEC-05 vinculados por unidad viven
  en la columna `Spec scenarios linked` de la tabla (columna 10 del schema, no fence).
- Los IDs de unidad del fence coinciden exactamente con la columna `Unit` de la tabla.

## 1. Scope (in/out)

**In** (autoridad: proposal § Scope + spec SPEC-01…SPEC-04 + design §4):

1. Inventario SHA pre-borrado + validación de listas (WU-VERIFY-PREP, previa a todo borrado).
2. Borrado legacy + huérfanos + incoherentes + retirados por deduplicación (WU-LEGACY-DEL).
3. Recabecerado serie `20260727-p*` v8→v14 campo-a-campo, 22 ficheros (WU-SERIE-V14).
4. Creación 28 slots / 29 ficheros canónicos v14 (WU-EXAMPLES-28, `slots: 28, files: 29`).
5. Migración locator + regeneración de proyección + 3 consumidores (WU-LOCATOR).

**Out**: cambios de producto/criterios/bundles App Map; crear `scripts/project/tasks.ts` o
cualquier CLI; crear rama/push/PR/merge (propiedad `sdd-orchestrator`); verificación
browser/runtime; tests nuevos; tocar mirrors (`binding.artifact_store.mirrors: []`); escribir
el índice (single-writer `sdd-orchestrator`).

## 2. Prose acceptance criteria (referencia al delta aprobado, sin definición nueva)

La prosa debajo remite al delta vacío aprobado y a SPEC-01…SPEC-06; no define criterios nuevos:

1. Existen 28 slots / 29 ficheros de ejemplo con frontmatter válido contra
   `TaskFlowBindingV2` v14 (22 fase + 4 controles acción + terminal `done` + par
   blocked/failed con phase/state preservados), sin ningún valor de
   `binding.retired_aliases` (SPEC-01-A/B/C/D + SPEC-05).
2. Borrados los 7 legacy `2026-04-17-*`, el huérfano `20260728-ff24s9-*` y los 3 incoherentes
   (`20260706-*`, `20260825-bhbr8k-*`, `20260913-vn3n31-*` + dirs asociados) más los retirados
   por deduplicación AD-03; serie `20260727-p*` recabecerada a v14 sin duplicados contra los 28
   (SPEC-02 + SPEC-03 + SPEC-03-B).
3. `.agents/sdd-workflow.json` resuelve el binding v14 (`binding_path` satélite SDD,
   `expected_binding_version` 14.0.0, proyecciones existentes) y los 3 consumidores ya no
   pinean v10/path fantasma; `taskflow:generate`/checks relacionados verdes (SPEC-04).
4. `docs/app-map/**` intacto (0 diffs) y delta de criterios vacío con `no_criteria_reason`
   aprobado; `criteria_covered: []` coherente con §3 del índice (SPEC-05 + SPEC-06).
5. Branch + PR único registrados en índice §9; gates de cierre
   (`pending_environment_close_block`, `requirements_current_close_block`) sin bloqueos
   pendientes; cierre solo en forma terminal única `{ phase: null, state: "done", status: "done" }`.

## 3. Owned files (resumen por WU; detalle en §5 y §7)

- **WU-VERIFY-PREP** (lectura + inventario): lee §7.1–§7.5; escribe inventario en §8 de este
  artifact + evidencia `apply-WU-VERIFY-PREP.md`. No muta ningún otro path.
- **WU-LEGACY-DEL**: §7.1 (7 legacy + huérfano + 3 incoherentes + dirs `*/` + retirados AD-03).
- **WU-SERIE-V14**: §7.2 (`taskReadme/20260727-p*.md`, 22 ficheros; dirs `*/` existentes se
  conservan, no se renombran).
- **WU-EXAMPLES-28**: §7.3 (`taskReadme/20261001-sdd1401-*` … `taskReadme/20261001-sdd1429-*`,
  29 ficheros nuevos).
- **WU-LOCATOR**: §7.4 (`.agents/sdd-workflow.json`,
  `.agents/skills/projectctl-sdd/generated/phase-state-schema.json`,
  `.atl/skill-registry.md`, `docs/04-process/task.md`, `AGENTS.md` condicional).
- **No tocados** (§7.5): `docs/app-map/**` (solo lectura), `frontend/`, `backend/`/`api/`,
  `shared/`, `tests/`, `scripts/`, `compose/`, superficies prohibidas, mirrors, índice, rama/PR.

## 4. Work-unit table (13 columnas canónicas + artifact target / done condition en §5)

Orden = orden de ejecución normativo (design §6). `Estado` inicial de todas: `pending`.
`Mirror topic` = `none` en todas (`binding.artifact_store.mirrors: []`, sin ledger por fase;
evidencia en `apply-<unit_id>.md`).

| Unit | Estado | apply_lane | Objetivo | Archivos owned | Depende de | Conflict group | Modo | Mirror topic | Spec scenarios linked | Implementation contract | Verify expects | Routing tag on failure |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| WU-VERIFY-PREP | pending | none | Registrar inventario paths+SHA pre-borrado y validar listas cerradas contra disco antes de cualquier mutación | `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/tasks.md` (§8 inventario) · `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/apply-WU-VERIFY-PREP.md` (lectura sobre §7.1–§7.5, sin mutarlos) | none | none | sdd-orchestrator-only | none | SPEC-02 (inventario SHA previo + no-huérfanos) · SPEC-05 (YAML/retired_alias/`phase:null`/writable/status=phase/index_budget/mirrors-`[]`/app-map-0-diffs) · SPEC-06 (persistencia/superficies/excluidos-commit) | Nombrar la tabla de inventario §8 (una fila por path de §7.1+§7.2+§7.4 con SHA256) + tabla de deduplicación definitiva §9 + veredicto existencia `client_view_model`/`client_generated_ts` y pin `AGENTS.md` (design QQ 2/5/6) | `apply-WU-VERIFY-PREP.md` lista cada path §7.1 con `exists: true/false + SHA256`; §8/§9 de `tasks.md` rellenos sin `TBD`; 0 valores `retired_aliases` en las listas; `docs/app-map/**` intacto | tasks_contract_missing |
| WU-LEGACY-DEL | pending | none | Borrar legacy + huérfanos + incoherentes + retirados AD-03 con sus dirs asociados, sin tocar `docs/app-map/**` | `taskReadme/2026-04-17-test-task-for-state-*.md` (7) · `taskReadme/20260728-ff24s9-pw-e2e-test-1785240291958/` · `taskReadme/20260706-testtab-test-tab-funcional-colpruebas.md` (+ dir `*/`) · `taskReadme/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests.md` (+ dir `*/`) · `taskReadme/20260913-vn3n31-state-test-p1-started.md` (+ dir `*/`) · retirados §9 (lista definitiva con SHA) | WU-VERIFY-PREP | taskreadme | sdd-orchestrator-only | none | SPEC-02 (borrado con inventario + no-huérfanos) · SPEC-05 (no `retired_aliases`, app-map 0 diffs) | Borrado exacto de los paths inventariados en §8 filas L01–L11 + §9 (owner `sdd-orchestrator`; rollback `git checkout develop -- <paths>` por owner de entrega) | Ningún path §8 L01–L11 ni §9 existe en el árbol; ningún dir `taskReadme/<task_id>-<task_slug>/` huérfano; barrido `retired_aliases` en `taskReadme/` = 0; `docs/app-map/**` 0 diffs; evidencia en `apply-WU-LEGACY-DEL.md` | tasks_contract_missing |
| WU-SERIE-V14 | pending | doc | Recabecerar 22 serie `20260727-p*` v8→v14 campo-a-campo, sin renombrar paths ni dirs `*/` | `taskReadme/20260727-p*.md` (22: `p1strt,p1xplor,p1draft,p1await,p1revis,p1accpt,p2plan,p2impl,p2review,p2await,p2revis,p2accpt,p3prep,p3run,p3fix,p3cover,p3done,p4start,p4doc,p4review,p4revis,p4done` + `prpdemo` según §9) | WU-LEGACY-DEL | taskreadme | serial | none | SPEC-03 (frontmatter v14 + sin `error_message` + `branch_name` patrón + dedup) · SPEC-05 (YAML válido, `status ∈ writable`, `status`=status de fase, sin `retired_aliases`) | Mutación por fichero según SPEC-03-A + snippet design §5.1: `binding_version→"14.0.0"`, `binding_path→satélite SDD`, `branch_name→feature/<id>-<slug>`, `pr_url→""`, `blocked_reason→""`, REMOVED `error_message`, cuerpo a 9 secciones v14 + bloque origen; `status/phase/state` preservados | Cada fichero §7.2 parsea YAML con `binding_version:"14.0.0"`, sin clave `error_message`, `branch_name` = `feature/<task_id>-<task_slug>`, `status` = status de su fase; 0 `retired_aliases`; evidencia en `apply-WU-SERIE-V14.md` | doc_issue |
| WU-EXAMPLES-28 | pending | doc | Crear 29 ficheros canónicos v14 (28 slots) con convención AD-01 y snippets literales | `taskReadme/20261001-sdd1401-ex-p1-started.md` … `taskReadme/20261001-sdd1429-ex-failed-p3-test-running.md` (29 ficheros; tabla AD-01/spec SPEC-01) | WU-SERIE-V14 | taskreadme | serial | none | SPEC-01-A (status=status de fase) · SPEC-01-B (controles = `controls[].value` literal) · SPEC-01-C (terminal `phase:null` real) · SPEC-01-D (outcome preserva phase/state, `writes_state:false`) · SPEC-01 anti-drift (`retired_aliases` = 0) · SPEC-05 (terminal/estado/fase) | Creación según design AD-01 + snippets §5.1 (base), §5.2 (#27 done), §5.3 (28a blocked; 28b simétrico failed); cuerpo 9 secciones v14 + `kind/writes_state/owner/preserves` didácticos; `slots:28, files:29` | Los 29 ficheros parsean YAML; #01–22 `status`=status de fase y `state ∈ phases[].states`; #23–26 idénticos a `controls[].value` + cuerpo con `kind:action/writes_state:true/owner`; #27 = `{phase:null,state:done,status:done}` con null real (string `"null"` rechazado); 28a/28b `blocked/failed` con phase/state preservados + `writes_state:false`; 0 `retired_aliases`; evidencia en `apply-WU-EXAMPLES-28.md` | doc_issue |
| WU-LOCATOR | pending | doc | Migrar locator + regenerar proyección + actualizar 3 consumidores, sin eliminar el locator | `.agents/sdd-workflow.json` · `.agents/skills/projectctl-sdd/generated/phase-state-schema.json` · `.atl/skill-registry.md` · `docs/04-process/task.md` · `AGENTS.md` (solo si pinea versión) | WU-EXAMPLES-28 | locator-docs | serial | none | SPEC-04-A (diff locator + regeneración + generate verde) · SPEC-04-B (3 consumidores sin v10/fantasma) · SPEC-04 no-eliminación · SPEC-05/06 (docs-lint, app-map 0 diffs, commitables) | Diff exacto design §5.4 (mismo path, solo contenido) + regeneración `phase-state-schema.json` (`generated_at`/`source_sha256` vigentes) + fila `tareas` en skill-registry → satélite SDD v14.0.0 + `docs/04-process/task.md` 6 ocurrencias v10→v14 + `AGENTS.md` condicional | `binding_path` existe en disco, `expected_binding_version:"14.0.0"`, ambas proyecciones SDD existen; 0 ocurrencias `10.0.0` y 0 path fantasma `projectctl-requirements/references/tasks/binding.md` en los 3 consumidores; `taskflow:generate` + checks verdes; `docs-lint` verde; evidencia en `apply-WU-LOCATOR.md` | doc_issue |

Complejidad → `apply_lane` (§3 del schema): las tres WU `doc` tocan 1 superficie (SDD
documental), sin migración SQL/seguridad/lógica de negocio; el conteo de ficheros
(22/29/5) NO fuerza `code-high` porque no son código (señales §3 aplican a `code-*`;
para doc la lane es `sdd-apply-doc` por naturaleza del cambio). Las dos WU `none` son
trabajo mecánico `sdd-orchestrator-only` (inventario/lectura y borrado destructivo con
rollback por checkout), fuera de toda apply lane.

## 5. Detalle por WU (artifact target, done condition, routing)

### WU-VERIFY-PREP — Inventario SHA + validación (apply_lane: none, owner sdd-orchestrator)

- **Objetivo**: dejar el inventario paths+SHA y las listas cerradas validadas en disco antes
  de cualquier mutación (pre-condición normativa de WU-LEGACY-DEL).
- **Archivos owned**: `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/tasks.md` (§8+§9)
  y `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/apply-WU-VERIFY-PREP.md`.
  Alcance de lectura: todos los paths de §7.1–§7.5.
- **Conflict group**: `none` (solo lectura + escritura de inventario; no muta targets).
- **Modo**: `sdd-orchestrator-only` (mecánico, sin apply lane; no paralelizable con su
  dependiente).
- **Artifact target**: `apply-WU-VERIFY-PREP.md` + §8/§9 rellenos de este `tasks.md`.
- **Implementation contract**: tabla §8 con una fila por path (SHA256 o `missing` declarado)
  + tabla §9 (retirados AD-03 definitivos) + veredictos design QQ 2/5/6.
- **Done condition**: §8/§9 sin `TBD`; cada path §7.1 con `exists + SHA256`; decisiones QQ
  2/5/6 registradas; `docs/app-map/**` intacto.
- **Verify expects**: inspección de `apply-WU-VERIFY-PREP.md` + §8/§9 (ver columna 12).
- **Routing tag on failure**: `tasks_contract_missing` (vuelve a planning: listas/inventario).
- **Depende de**: `none` (primera de la cadena).

### WU-LEGACY-DEL — Borrado (apply_lane: none, owner sdd-orchestrator)

- **Objetivo**: eliminar §7.1 + §9 con sus dirs asociados; quitar todos los aliases retirados
  del árbol para que las validaciones anti-drift posteriores no den falsos positivos.
- **Archivos owned**: ver §7.1 + §9 (lista cerrada tras VERIFY-PREP).
- **Conflict group**: `taskreadme` (comparte dir con SERIE/EXAMPLES → serial).
- **Modo**: `sdd-orchestrator-only` (destructivo; solo orchestrator; rollback por checkout).
- **Artifact target**: `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/apply-WU-LEGACY-DEL.md`
  (contenido previo guardado para rollback + lista borrada con SHA).
- **Implementation contract**: borrado exacto de §8 L01–L11 + §9.
- **Done condition**: 0 paths restantes + 0 dirs huérfanos + 0 `retired_aliases` en `taskReadme/`.
- **Verify expects**: ausencia en árbol + barridos (ver columna 12).
- **Routing tag on failure**: `tasks_contract_missing` (inventario/contrato de borrado).
- **Depende de**: WU-VERIFY-PREP (inventario previo obligatorio).

### WU-SERIE-V14 — Recabecerado 22 (apply_lane: doc, lane sdd-apply-doc)

- **Objetivo**: 22 ficheros §7.2 a plantilla v14 sin renombrar ni tocar valores phase/state.
- **Archivos owned**: `taskReadme/20260727-p*.md` (22 + `prpdemo` según §9).
- **Conflict group**: `taskreadme` (serial con LEGACY-DEL/EXAMPLES-28).
- **Modo**: `serial` (dependencia de LEGACY-DEL + dedup AD-03; intra-WU: ficheros
  `parallel-safe` por paths disjuntos).
- **Artifact target**: `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/apply-WU-SERIE-V14.md`.
- **Implementation contract**: SPEC-03-A fila a fila + snippet §5.1.
- **Done condition**: 22 frontmatter `14.0.0` + sin `error_message` + `branch_name` patrón.
- **Verify expects**: parseo + aserciones por fichero (ver columna 12).
- **Routing tag on failure**: `doc_issue` (rework a `sdd-apply-doc`).
- **Depende de**: WU-LEGACY-DEL.

### WU-EXAMPLES-28 — Creación 29 ficheros (apply_lane: doc, lane sdd-apply-doc)

- **Objetivo**: 29 ficheros §7.3 canónicos v14, `slots: 28, files: 29` (decisión separar AD-02).
- **Archivos owned**: `taskReadme/20261001-sdd1401-*` … `taskReadme/20261001-sdd1429-*` (29).
- **Conflict group**: `taskreadme` (serial con SERIE por AD-03; ficheros disjuntos de la serie
  por construcción `20261001-sdd14*` vs `20260727-p*` + prefijo slug `ex-` vs `state-`).
- **Modo**: `serial` (dependencia de SERIE-V14; intra-WU: ficheros `parallel-safe`).
- **Artifact target**: `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/apply-WU-EXAMPLES-28.md`.
- **Implementation contract**: tabla AD-01 + snippets §5.1/§5.2/§5.3.
- **Done condition**: 29 ficheros parsean; valores literales SPEC-01 verificados; `slots/files` registrado.
- **Verify expects**: aserciones #01–28b (ver columna 12).
- **Routing tag on failure**: `doc_issue`.
- **Depende de**: WU-SERIE-V14 (regla AD-03: los 28 nuevos mandan sobre la serie).

### WU-LOCATOR — Migración locator + consumidores (apply_lane: doc, sdd-orchestrator + apply-doc)

- **Objetivo**: locator migrado (nunca eliminado) + proyección regenerada + 3 consumidores sin
  v10/fantasma.
- **Archivos owned**: ver §7.4 (5 paths, uno condicional).
- **Conflict group**: `locator-docs` (disjunto de `taskreadme`, pero serial por orden normativo:
  el `generate` debe correr contra el árbol ya estable).
- **Modo**: `serial` (depende de EXAMPLES-28; última mutación antes de verificación).
- **Artifact target**: `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/apply-WU-LOCATOR.md`.
- **Implementation contract**: diff §5.4 + regeneración + 3 consumidores (SPEC-04-A/B).
- **Done condition**: locator resuelve v14 + 0 `10.0.0`/fantasma + generate/checks/lint verdes.
- **Verify expects**: existencia en disco + barridos + checks (ver columna 12).
- **Routing tag on failure**: `doc_issue`.
- **Depende de**: WU-EXAMPLES-28.

## 6. Orden recomendado + parallel-safety

Orden normativo (design §6, secuencial entre WUs):

```
WU-VERIFY-PREP (none, orchestrator-only)
  → WU-LEGACY-DEL (none, orchestrator-only)
    → WU-SERIE-V14 (doc, serial)
      → WU-EXAMPLES-28 (doc, serial)
        → WU-LOCATOR (doc, serial)
          → verificación documental (verify lanes si el orchestrator lo exige)
```

- Ninguna WU es `parallel-safe` entre sí: todas tienen dependencia transitiva directa
  (cadena lineal) y SERIE/EXAMPLES/LEGACY comparten `conflict group: taskreadme`.
- Paralelismo permitido solo **intra-WU** en las tres WU `doc`: fichero a fichero
  (`parallel-safe` por paths disjuntos, sin solape de globs `20260727-p*` vs
  `20261001-sdd14*` vs §7.4).
- `code-high` nunca paralelizable: no aplica (0 WU de código en esta tarea).
- Ante fallo: `tasks_contract_missing` → vuelve a `sdd-tasks`/planning (contrato/inventario);
  `doc_issue` → rework a `sdd-apply-doc` con el `apply-<unit_id>.md` como evidencia.

## 7. Owned files / secciones por WU (listas cerradas de spec/design)

### 7.1 WU-LEGACY-DEL — paths a eliminar (SPEC-02-A/B + design §4.1; SHA en §8)

| Fila | Path | Motivo |
|---|---|---|
| L01 | `taskReadme/2026-04-17-test-task-for-state-done.md` | Alias retirado |
| L02 | `taskReadme/2026-04-17-test-task-for-state-pushing.md` | Alias `pushing` |
| L03 | `taskReadme/2026-04-17-test-task-for-state-blocked.md` | Legacy |
| L04 | `taskReadme/2026-04-17-test-task-for-state-verified.md` | Alias `verified` |
| L05 | `taskReadme/2026-04-17-test-task-for-state-ready-for-branch.md` | Alias `ready_for_branch` |
| L06 | `taskReadme/2026-04-17-test-task-for-state-branching.md` | Alias `branching` |
| L07 | `taskReadme/2026-04-17-test-task-for-state-failed.md` | Legacy |
| L08 | `taskReadme/20260728-ff24s9-pw-e2e-test-1785240291958/` (dir completo) | Huérfano sin índice |
| L09 | `taskReadme/20260706-testtab-test-tab-funcional-colpruebas.md` (+ dir `*/` si existe) | Incoherente |
| L10 | `taskReadme/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests.md` + `taskReadme/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests/` (17 artifacts) | Incoherente |
| L11 | `taskReadme/20260913-vn3n31-state-test-p1-started.md` (+ dir `*/` si existe) | Incoherente |
| L12+ | Retirados por deduplicación AD-03 (lista definitiva en §9, con SHA; candidatos conocidos: colisiones `p1_accepted`, `p4_reviewing`) | Colisión phase/state con nuevos |

### 7.2 WU-SERIE-V14 — 22 ficheros (SPEC-03 + design §4.2; sin renombrar)

Glob: `taskReadme/20260727-p*.md` — `p1strt, p1xplor, p1draft, p1await, p1revis, p1accpt,
p2plan, p2impl, p2review, p2await, p2revis, p2accpt, p3prep, p3run, p3fix, p3cover, p3done,
p4start, p4doc, p4review, p4revis, p4done` (+ `20260727-prpdemo-*` según veredicto §9).
Dirs `*/` existentes (`p1strt, p1xplor, p1draft, p1await, p1revis, p1accpt, p2impl, p4review`)
se conservan, NO se renombran.

### 7.3 WU-EXAMPLES-28 — 29 ficheros nuevos (SPEC-01 + design AD-01/AD-02; `slots: 28, files: 29`)

`taskReadme/20261001-sdd1401-ex-p1-started.md` … `taskReadme/20261001-sdd1406-ex-p1-accepted.md`
(6 p1) · `taskReadme/20261001-sdd1407-ex-p2-planning.md` …
`taskReadme/20261001-sdd1412-ex-p2-accepted.md` (6 p2) ·
`taskReadme/20261001-sdd1413-ex-p3-test-preparing.md` …
`taskReadme/20261001-sdd1417-ex-p3-complete.md` (5 p3) ·
`taskReadme/20261001-sdd1418-ex-p4-started.md` …
`taskReadme/20261001-sdd1422-ex-p4-complete.md` (5 p4) ·
`taskReadme/20261001-sdd1423-ex-branch-creation-pending.md`,
`taskReadme/20261001-sdd1424-ex-final-commit-pending.md`,
`taskReadme/20261001-sdd1425-ex-final-push-pending.md`,
`taskReadme/20261001-sdd1426-ex-final-pr-pending.md` (4 controles) ·
`taskReadme/20261001-sdd1427-ex-done.md` (terminal, `phase: null` real) ·
`taskReadme/20261001-sdd1428-ex-blocked-p2-code-review.md` (28a) +
`taskReadme/20261001-sdd1429-ex-failed-p3-test-running.md` (28b).

### 7.4 WU-LOCATOR — locator + proyección + consumidores (SPEC-04 + design §4.4/§5.4)

- `.agents/sdd-workflow.json` (mismo path, solo contenido; diff design §5.4).
- `.agents/skills/projectctl-sdd/generated/phase-state-schema.json` (regenerar; excluida del
  conteo authored como golden generada).
- `.atl/skill-registry.md` (fila `projectctl-requirements/tareas` → satélite SDD v14.0.0).
- `docs/04-process/task.md` (6 ocurrencias: pins `v10.0.0`→`v14.0.0`, path fantasma→path SDD).
- `AGENTS.md` (solo si pinea versión; veredicto en §9/QQ5).

### 7.5 No tocados

`docs/app-map/**` (0 diffs), `frontend/`, `backend/`/`api/`, `shared/`, `tests/`, `scripts/`,
`compose/`, superficies prohibidas (`proposals/**`, `specs/**`, `designs/**`, `tasks/**`,
`openspec/**`, `.agents/skills/projectctl-requirements/references/tareas.md`,
`.agents/skills/sdd-tasks/tasks.md`), mirrors (`[]`), índice (orchestrator), rama/PR (orchestrator).

## 8. Inventario SHA pre-borrado (rellena WU-VERIFY-PREP antes de WU-LEGACY-DEL)

> Pre-condición normativa de SPEC-02: sin esta tabla completa NO se autoriza WU-LEGACY-DEL.
> `sdd-orchestrator` registra `exists + SHA256` por path (o `missing` declarado si no existe).
> Rollback: `git checkout develop -- <paths>` por el owner de entrega.

| Fila | Path | exists | SHA256 |
|---|---|---|---|
| L01 | `taskReadme/2026-04-17-test-task-for-state-done.md` | TBD | TBD |
| L02 | `taskReadme/2026-04-17-test-task-for-state-pushing.md` | TBD | TBD |
| L03 | `taskReadme/2026-04-17-test-task-for-state-blocked.md` | TBD | TBD |
| L04 | `taskReadme/2026-04-17-test-task-for-state-verified.md` | TBD | TBD |
| L05 | `taskReadme/2026-04-17-test-task-for-state-ready-for-branch.md` | TBD | TBD |
| L06 | `taskReadme/2026-04-17-test-task-for-state-branching.md` | TBD | TBD |
| L07 | `taskReadme/2026-04-17-test-task-for-state-failed.md` | TBD | TBD |
| L08 | `taskReadme/20260728-ff24s9-pw-e2e-test-1785240291958/` | TBD | TBD (dir: listar contenido) |
| L09 | `taskReadme/20260706-testtab-test-tab-funcional-colpruebas.md` (+ dir) | TBD | TBD |
| L10 | `taskReadme/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests.md` (+ dir, 17 artifacts) | TBD | TBD |
| L11 | `taskReadme/20260913-vn3n31-state-test-p1-started.md` (+ dir) | TBD | TBD |
| S01–S22 | `taskReadme/20260727-p*.md` (22 + `prpdemo`; una fila por fichero real) | TBD | TBD |
| C01–C05 | Locator + proyección + 3 consumidores + `AGENTS.md` (baseline pre-migración) | TBD | TBD |

## 9. Deduplicación definitiva serie-vs-nuevos (regla AD-03; confirma WU-VERIFY-PREP)

Regla: ante igual `phase`/`state`, permanece el nuevo (v14 nativo); el fichero de serie en
colisión se retira vía WU-LEGACY-DEL con inventario previo.

| Nuevo (canónico) | Serie en colisión conocida | Veredicto |
|---|---|---|
| `20261001-sdd1406` (`p1_accepted`) | `20260727-p1accpt-*` (+ dir `*/`) | TBD (confirmar en disco; por defecto: retirar serie) |
| `20261001-sdd1420` (`p4_reviewing`) | `20260727-p4review-*` (+ dir `*/`) | TBD (confirmar en disco; por defecto: retirar serie) |
| otros solapes `phase`/`state` detectados | `taskReadme/20260727-p*.md` restantes | TBD (barrido completo en VERIFY-PREP) |
| `20260727-prpdemo-*` (demo) | — | TBD (QQ6: ¿SERIE-V14 o LEGACY-DEL?) |

Preguntas abiertas de design §9 para cerrar en VERIFY-PREP: existencia de
`client_view_model`/`client_generated_ts` (QQ2, sin inventar accessor), pin de versión en
`AGENTS.md` (QQ5, cita literal), límite 28 vs 29 (QQ3, por defecto separar), verify lanes
exigidas (QQ4).

## 10. Workload forecast (asesoría para `binding.modes.delivery_mode`)

- Líneas authored estimadas (adiciones + borrados; excluye golden generada
  `phase-state-schema.json` del conteo authored aunque sigue en el cambio):
  SERIE-V14 ~22 ficheros × ~80 líneas ≈ 1760 + EXAMPLES-28 29 ficheros × ~80 líneas ≈ 2320
  + LOCATOR/consumidores ≈ 60 + inventarios/evidencias ≈ 200 → **~4300 líneas authored**.
- `400-line budget risk: High` (estimación supera 400 authored lines por un orden de magnitud;
  es volumen mecánico-documental con paths disjuntos, no complejidad).
- `Chained PRs recommended: Yes` (por volumen; salvo que `binding.delivery` + proposal impongan
  PR único — decisión final de `sdd-orchestrator`, que mantiene `single-pr` por defecto).

## 11. Validación (estrategia documental + estática; AD-05, design §7, SPEC-05/06)

1. Bloque machine `task-flow-binding` v14.0.0 en
   `.agents/skills/projectctl-sdd/references/tasks/binding.md` como SoT de `phases[]` /
   `controls[]` / `status.writable` (8) / `retired_aliases[]`; cada frontmatter se valida por
   lectura (SPEC-05: 7 bullets Given/When/Then).
2. `bun scripts/sdd-doctor.ts` verde (tras WU-LOCATOR; owner orchestrator/verify).
3. `bun scripts/taskflow.ts --check` + `taskflow:generate` verdes tras regenerar proyección
   (editar locator sin regenerar = drift bloqueante).
4. `bun scripts/projectctl-docs.ts lint` verde sobre docs tocados.
5. Barridos por lectura: 0 `retired_aliases`, 0 `"null"` entrecomillado, rechazo
   `pending`+`p1_started`, índice ≤ `index_budget`, persistencia índice+artifacts con
   `mirrors: []`, `docs/app-map/**` 0 diffs, sin `force-add` (reportar path generado como
   `policy review required`).
6. Ninguna lane ejecuta `projectctl`/`git`/tests/builds/browser; 0 tests nuevos (regla `// @ac`
   no aplica a taskReadme); `verify-code` sobre diffs doc solo si el orchestrator lo exige.

## 12. Verification mapping (schema §6; comportamento de verify lanes, no planning)

| `apply_lane` | Verify lane requerida |
|---|---|
| `doc` (SERIE-V14, EXAMPLES-28, LOCATOR) | `sdd-verify-code` (read-only doc/policy review, `artifact_class: "code_review"`) |
| `none` (VERIFY-PREP, LEGACY-DEL, orchestrator-owned) | none (mecánico de orchestrator; su evidencia `apply-<unit>.md` la revisa el orchestrator) |

Fallo en verify con cobertura ausente se rutea según columna 13 (`doc_issue` /
`tasks_contract_missing`); `tasks_contract_missing` vuelve a esta lane (planning), nunca a
una apply lane.

## 13. Superficies, persistencia y entrega

- Persistencia única: índice + phase artifacts (`proposal/spec/design/tasks/apply-<unit>/verify-*`);
  `sdd-tasks` escribe ÚNICAMENTE este `tasks.md`; el índice lo escribe `sdd-orchestrator`.
- Prohibidas: `proposals/**`, `specs/**`, `designs/**`, `tasks/**`, `openspec/**`,
  `.agents/skills/projectctl-requirements/references/tareas.md`,
  `.agents/skills/sdd-tasks/tasks.md`; tampoco mirrors.
- Excluidos de commit: `.env`, `.env.dev`, `.runtime/`, `frontend/test-results/` (firma:
  `.env.example`); sin secretos; todos los paths §7 son commitables por flujo normal.
- Entrega: rama `feature/20261001-sdd14-regen-taskreadme-binding-v14` desde `develop` + PR único
  (propiedad `sdd-orchestrator`; rama aún no creada → bloqueado hasta `branch_creation_pending`);
  cierre solo `{ phase: null, state: "done", status: "done" }`.
