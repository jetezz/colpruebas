---
file: references/sources.md
parent_skill: projectctl-requirements
owner: documentation maintenance
purpose: machine-grepeable SoT table for all PCT-89..PCT-121 + criterios nuevos PCT-149..155/TST-38/AC-329/PCT-169..175 + cross-tab/standard requirements
sot_policy: canonical-standard
last_full_regen: 2026-09-20
generated_by: merge resolution after develop integration
binding_role: cites_task_flow_binding_block_only
---

# `.agents/skills/projectctl-requirements/references/sources.md` — Tabla de trazabilidad machine-grepeable

> **Tabla de trazabilidad** para el contenido de la skill `projectctl-requirements`. La autoridad normativa del workflow es exclusivamente el bloque delimitado de `.agents/skills/projectctl-requirements/references/tasks/binding.md`; esta tabla no crea una segunda autoridad. **last-verified: 2026-09-20**. Los detalles de tunnel, secretos, red y topología pertenecen a los docs locales del repositorio destino.
>
> La tabla mantiene paths en inline-code para trazabilidad. `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` verifica un conjunto explícito y acotado de paths e invariantes; no escanea genéricamente cada cita de esta tabla.

## Rol respecto al bloque `task-flow-binding`

Este archivo no duplica valores del bloque `task-flow-binding` (`TaskFlowBindingV2`, v10.0.0, model 2).

- **Traza**: cita el path del binding, su `binding_id`, `binding_version` y el delimitador del bloque (`` `<!-- task-flow-binding:start -->` `` / `` `<!-- task-flow-binding:end -->` ``) para que el consumidor sepa dónde extraerlo.
- **No inventa machine values**: las entries de la tabla `Task flow binding (PCT-106..PCT-121)` apuntan al bloque delimitado; nunca reproducen el catálogo de estados, lanes, gates, `artifact_store` (primary index, `phase_artifacts`, `mirrors[].role`), `heading_owners`, `delivery` o `active_sources` en esta tabla. Cualquier divergencia con el bloque se considera drift y bloquea la entry hasta regenerarse.
- **No redefine fases/lanes/gates**: si una entry necesita un valor del workflow, cita `task.required_inputs`, `task.heading_owners`, `phases[].id`, `lanes[id]`, `gates[id]`, `artifact_store.primary`, `artifact_store.phase_artifacts`, `mirrors[]`, etc., por su identificador dentro del bloque; el bloque sigue siendo la única fuente normativa de esos valores.

## Cómo regenerar este archivo

Per `.agents/skills/projectctl-requirements/references/maintenance.md` §"Contrato anti-drift":

1. Detectar el cambio upstream en una SoT (skill path / bundle path / CLI / API / test path).
2. Actualizar la entry correspondiente en cualquiera de los 9 archivos `.md` que viven bajo `references/` (cli, doc, test, entorno, tareas, standard, sources, maintenance, decisions) con la nueva ruta/contrato.
3. Regenerar **completo** este `.agents/skills/projectctl-requirements/references/sources.md` (no se editan cells sueltas; la tabla es invariante por construcción).
4. Bumpear `last-verified` de las entries afectadas (formato `YYYY-MM-DD`) — un bump por entry, no global.
5. Bumpear `metadata.version` en el frontmatter del archivo `.agents/skills/projectctl-requirements/SKILL.md` per la regla PATCH/MINOR/MAJOR (ver `.agents/skills/projectctl-requirements/references/maintenance.md` §"Versionado cross-repo").
6. Correr el comando Bun test sobre el archivo `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` (presente desde WU-TEST-3) y confirmar verde.

> **Traza del maintenance-contract — formato del skill-registry**: el contrato anti-drift
> cubre también el formato del row del skill-registry, documentado en
> `.agents/skills/projectctl-requirements/references/maintenance.md` §10
> "Skill-registry generator format (SoT del row shape del registry)". El generador
> canónico `gentle-ai skill-registry refresh --force` es la SoT del shape (header
> `Auto-generated`, 4 columnas con backticks discipline y path absoluto derivado de
> `REPO_ROOT`), emite exactamente **24 project skills** y **excluye por contrato** las
> workflow skills `sdd-*` (resolubles en disco vía Check A del test). Este archivo traza
> esa sección sin redefinir sus machine values: el shape y el conteo de filas los valida
> `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` (Check B, registry →
> formato). Cualquier cambio de formato/scope del generador MUST bumpear
> `metadata.version` del package per `maintenance.md` §5. **last-verified: 2026-09-07**
> (regenerar ante cualquier cambio en el generador o en su output).

> **Traza del maintenance-contract — shape del criterio app-map (PCT-85)**: el contrato
> `criteria[]` de `docs/app-map/**` requiere el campo **obligatorio** `type` (enum cerrado de 9:
> `ui | functionality | a11y | backend | data | integration | security | performance | tooling`,
> T-1) — shape post-rollout `{id, title, functional, coverage, type}` con `type` requerido
> (hardening R-A: cláusula T-3 opcional retirada y set faseado `TYPE_MIGRATION_PENDING_BUNDLES`
> eliminado; criterio sin `type` = hard error de `docs:lint` con
> `[app-map-contract] <file>: criterion <id> requires type`), documentado en
> `.agents/skills/projectctl-requirements/references/doc.md` PCT-85 y en
> `.agents/skills/projectctl-requirements/references/standard.md` §1 (árbol de clasificación T-5,
> verificación por defecto y contrato bidireccional R-B + "Auditoría de criterios"). La tabla SoT
> de este archivo NO contiene filas PCT-83..88 (la tabla completa de la tab Doc vive en
> `references/doc.md`); las filas PCT-89..105 de esta tabla no citan el shape del criterio y sus
> `last-verified` están pineados por `sot-coherence` (PCT-91/97/98/99 en `2026-09-06`, resto en
> `2026-07-24`); las filas PCT-106..121 trazan el bloque `task-flow-binding` sin cambios (binding
> v10.0.0). Este archivo traza el cambio sin redefinir sus machine values. **last-verified: 2026-09-07**
> (regenerar ante cualquier cambio en el shape del criterio o en `standard.md` §1).

## Cómo lo lee `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts`

La suite actual enumera los paths canónicos que deben existir y valida explícitamente locator, identidad del binding/projections, `active_sources`, aliases retirados y ausencia de catálogos duplicados. El snippet histórico siguiente no es el contrato actual y se retira para evitar afirmar un scanner genérico inexistente.

Cada garantía nueva debe aparecer como una aserción dedicada; no hay promesa de cobertura exhaustiva sobre todos los backticks.

---

## Tabla SoT por criterio (PCT-89..PCT-100 + cross-tab/skill)

> Cada fila es 1 criterio. Columnas:
>
> - `PCT ID` — criterio declarado en un bundle documental (`docs/app-map/**`): rango `PCT-79..PCT-105` (view `/projectctl`), `PCT-106..PCT-121` (binding de tareas) y los criterios nuevos de la sección final (`PCT-149..155`, `TST-38`, `AC-329`).
> - `Requisito` — qué debe ser cierto (resumen 1 línea).
> - `SoT skill path` — skill referenciada (inline-code; valida como existente).
> - `SoT bundle path` — bundle documental SoT (inline-code; valida como existente).
> - `SoT CLI/API/Runtime` — comando CLI, ruta API o servicio runtime asociado (inline-code cuando aplica).
> - `SoT test path` — path del test que valida el requisito (inline-code; puede ser `n/a` si solo validable por `sot-coherence`).
> - `last-verified` — fecha YYYY-MM-DD de última regeneración; bumpear ante cualquier cambio en cualquier SoT cell de la fila.

### Tab Test (PCT-89..PCT-94)

| PCT ID | Requisito | SoT skill path | SoT bundle path | SoT CLI/API/Runtime | SoT test path | last-verified |
| --- | --- | --- | --- | --- | --- | --- |
| `PCT-89` | Panel Test existe y lista reglas del sistema de testing | `.agents/skills/projectctl-requirements/references/standard.md` §2 | `docs/app-map/views/project-workspace/features/test-tab.md` | n/a (filesystem) | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` + `frontend/__tests__/projectctl-test-bundle.test.ts` | `2026-09-10` |
| `PCT-90` | Contrato AC mandatorio (`// @ac` + `test.info().annotations.push`) | `.agents/skills/projectctl-requirements/references/standard.md` §2 | `docs/app-map/views/project-workspace/features/test-tab.md` | `scripts/test-runner.ts` | `frontend/__tests__/TestPanel.quickrun-top-level-view.test.ts` | `2026-09-10` |
| `PCT-91` | Runner unificado + mapping 1:1 con `projectctl test *` (PCT-75..78) | `.agents/skills/projectctl-requirements/references/standard.md` §2 + `.agents/skills/projectctl-requirements/references/standard.md` §4 | `docs/app-map/views/projectctl/index.md` (PCT-75..PCT-78) | `scripts/test-runner.ts` + `sandbox/src/bin/projectctl.ts` | `frontend/__tests__/projectctl-test-bundle.test.ts` | `2026-09-10` |
| `PCT-92` | Persistencia `.runtime/test-results/<projectId>/<run-id>/`; auto-writeback de coverage diferido en v1 y estado `pending/not accepted` | `.agents/skills/projectctl-requirements/references/standard.md` §2 | `docs/app-map/views/project-workspace/features/test-tab.md` | `sandbox/src/services/test-results-writer.ts` | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` | `2026-09-10` |
| `PCT-93` | Gate `bun run test:check` (TST-13) + layout/discovery canónicos (TST-36) | `.agents/skills/projectctl-requirements/references/standard.md` §2 | `docs/app-map/views/project-workspace/features/test-tab.md` | `playwright.config.ts` + `scripts/test-runner.ts` | `frontend/__tests__/projectctl-test-bundle.test.ts` | `2026-09-10` |
| `PCT-94` | References: `playwright/TEST_PLAN.md` mapping + integrated testing policy | `.agents/skills/projectctl-requirements/references/standard.md` §2 | `docs/app-map/views/project-workspace/features/test-tab.md` | `playwright/TEST_PLAN.md` | `frontend/__tests__/projectctl-test-bundle.test.ts` | `2026-09-10` |

### Tab Entorno (PCT-95..PCT-100)

| PCT ID | Requisito | SoT skill path | SoT bundle path | SoT CLI/API/Runtime | SoT test path | last-verified |
| --- | --- | --- | --- | --- | --- | --- |
| `PCT-95` | Panel Entorno existe y lista reglas para arrancar + ser publicable + tunnel | `.agents/skills/projectctl-requirements/references/standard.md` §3 + `.agents/skills/sandbox-runtime-policy/SKILL.md` | `docs/00-context/entornos.md` | n/a (filesystem) | `frontend/__tests__/projectctl-entorno-bundle.test.ts` | `2026-09-10` |
| `PCT-96` | Overlays canónicos (`compose.yml` prod + `compose.dev.yml` dev) | `.agents/skills/projectctl-requirements/references/standard.md` §3 | `docs/00-context/entornos.md` + `docs/00-context/architecture.md` | `compose.yml` + `compose.dev.yml` + `.env.example` | `frontend/__tests__/projectctl-entorno-bundle.test.ts` | `2026-09-10` |
| `PCT-97` | Puertos canónicos por overlay: `FRONTEND_PORT`/`API_PORT` obligatorios en `.env` y `FRONTEND_DEV_PORT`/`API_DEV_PORT` obligatorios en `.env.dev` | `.agents/skills/projectctl-requirements/references/standard.md` §3 | `docs/app-map/views/projectctl/index.md` (PCT-35) | `projectctl env validate` (PCT-35) + `compose.yml` + `compose.dev.yml` + `.env.example` + `.env.dev.example` | `frontend/__tests__/projectctl-entorno-bundle.test.ts` | `2026-09-10` |
| `PCT-98` | Contrato edge externo + alias por entorno + guardrail `TUNNEL_NOT_PUBLISHABLE` | `.agents/skills/projectctl-requirements/references/standard.md` §3 | `docs/00-context/architecture.md` + `docs/02-features/tunnel.md` + `docs/app-map/views/projectctl/index.md` | `projectctl tunnel status` (PCT-38) + `compose.yml` + `compose.dev.yml` | `frontend/__tests__/projectctl-entorno-bundle.test.ts` | `2026-09-10` |
| `PCT-99` | Sandbox sin Docker CLI/socket — control de runtime exclusivamente via `projectctl` | `.agents/skills/sandbox-runtime-policy/SKILL.md` + `.agents/skills/projectctl-requirements/references/standard.md` §3 + `.agents/skills/projectctl-requirements/references/standard.md` §4 | `docs/app-map/views/projectctl/index.md` (PCT-30..PCT-45) | `sandbox/src/bin/projectctl.ts` | `frontend/__tests__/projectctl-entorno-bundle.test.ts` | `2026-09-10` |
| `PCT-100` | References: integrated runtime policy in `projectctl-requirements` | `.agents/skills/projectctl-requirements/references/standard.md` §3 | `docs/04-process/development.md` + `docs/02-features/tunnel.md` | n/a | `frontend/__tests__/projectctl-entorno-bundle.test.ts` | `2026-09-10` |

### Cross-tab + skill portability (PCT-101..PCT-105 — extracto; tabla completa en `.agents/skills/projectctl-requirements/references/maintenance.md` y en los archivos `.md` de `references/` para `cli` y `doc` por WU-SKILL-1)

| PCT ID | Requisito | SoT skill path | SoT bundle path | SoT CLI/API/Runtime | SoT test path | last-verified |
| --- | --- | --- | --- | --- | --- | --- |
| `PCT-101` | 8 tabs internos en orden fijo `cli → tareas → agentes → doc → criterios → test → entorno → estructura` | `.agents/skills/frontend-policy/SKILL.md` + `.agents/skills/fsd-architecture/SKILL.md` | `docs/app-map/views/projectctl/index.md` + `docs/app-map/navigation.yaml` | `frontend/src/views/projectctl/ui/ProjectctlView.tsx` + `frontend/src/views/projectctl/stores/tabs.store.ts` | `tests/e2e/projectctl/tabs.spec.ts` | `2026-09-20` |
| `PCT-102` | Cada tab MUST citar sources en un bloque aside con `data-testid="projectctl-tab-sources-<tab>"` (kebab-case; tab id ∈ `cli | tareas | agentes | doc | criterios | test | entorno | estructura`) | `.agents/skills/frontend-policy/SKILL.md` | `docs/app-map/views/projectctl/features/{cli,doc,criterios,test,entorno,tareas,estructura}.md` | `frontend/src/views/projectctl/ui/TabSources.tsx` | `tests/e2e/projectctl/tabs.spec.ts` | `2026-09-20` |
| `PCT-103` | El bundle raíz `index.md` preserva PCT-01..78 + tabla de mapeo a bundles por tab, incluyendo `features/criterios.md` y PCT-169..174 | `.agents/skills/projectctl-requirements/references/standard.md` heading `Documentación y app-map` | `docs/app-map/views/projectctl/index.md` + `docs/app-map/views/projectctl/features/{cli,doc,criterios,test,entorno,tareas}.md` | n/a | `frontend/__tests__/projectctl-doc-bundle.test.ts` + `frontend/__tests__/projectctl-test-bundle.test.ts` + `frontend/__tests__/projectctl-entorno-bundle.test.ts` + `frontend/__tests__/projectctl-tareas-bundle.test.ts` | `2026-09-20` |
| `PCT-104` | `data-testid` discipline kebab-case `<purpose>-<scope>` | `.agents/skills/frontend-policy/SKILL.md` + `.agents/skills/fsd-architecture/SKILL.md` | `docs/app-map/views/projectctl/index.md` | `frontend/src/views/projectctl/ui/ProjectctlView.tsx` | `frontend/__tests__/projectctl-tabs.test.ts` | `2026-09-10` |
| `PCT-105` | Paquete copiable sin modificaciones + Maintenance contract + prerequisitos de instalación explícitos | `.agents/skills/skill-creator/SKILL.md` + `.agents/skills/projectctl-requirements/references/standard.md` + `.agents/skills/projectctl-requirements/modules/coordinator/module.md` | `docs/00-context/agents_skills.md` + `docs/04-process/task.md` | n/a (filesystem-only) | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` (presente) | `2026-09-10` |

### Task flow binding (PCT-106..PCT-121)

> El binding integral vive en el bloque delimitado `task-flow-binding` (`TaskFlowBindingV2`, v10.0.0, model 2) dentro de `.agents/skills/projectctl-requirements/references/tasks/binding.md`. RDD se traza por identificadores del bloque; esta tabla no republica estados, lanes, guards ni gates.

| PCT ID | Requisito | SoT skill path | SoT bundle path | SoT CLI/API/Runtime | SoT test path | last-verified |
| --- | --- | --- | --- | --- | --- | --- |
| `PCT-106` | Creación con exactamente `task.required_inputs` obligatorios (binding integral) | `.agents/skills/projectctl-requirements/references/tasks/binding.md` JSON Pointer `/task/required_inputs` | n/a (bundle owned by WU-04) | n/a (taskReadme/coordinator contract) | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` | `2026-09-10` |
| `PCT-107` | Identidad, naming, `task.file_pattern`, `task.id_pattern`, `task.slug_pattern`, `delivery.branch_pattern` | `.agents/skills/projectctl-requirements/references/tasks/binding.md` JSON Pointers `/task` + `/delivery/branch_pattern` | n/a (bundle owned by WU-04) | n/a (taskReadme/coordinator contract) | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` | `2026-09-10` |
| `PCT-108` | `artifact_store.primary` (role index + `index_budget`), `artifact_store.phase_artifacts`, empty `mirrors[]`, `write_order` | `.agents/skills/projectctl-requirements/references/tasks/binding.md` JSON Pointer `/artifact_store` | n/a (bundle owned by WU-04) | n/a (filesystem-only) | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` | `2026-09-10` |
| `PCT-109` | Fases, states por fase y `controls[]`; incluye entrada RDD condicional y sin salida incondicional de documentación a commit | `.agents/skills/projectctl-requirements/references/tasks/binding.md` JSON Pointers `/phases` + `/controls` + `/modes/rdd_mode` | n/a (bundle owned by WU-04) | n/a (taskReadme state contract) | `frontend/__tests__/coordinator-state-machine.test.ts` | `2026-09-10` |
| `PCT-110` | Contrato, agentes, gate y loops de Fase 1 | `.agents/skills/projectctl-requirements/references/tasks/binding.md` identifiers `phases[id=fase_1_propuesta]` + `gates[AC-010.*]` | n/a (bundle owned by WU-04) | n/a | `frontend/__tests__/coordinator-state-machine.test.ts` | `2026-09-10` |
| `PCT-111` | Boundary de lanes y helpers opcionales: lane → surfaces → task-selected, dedupe first-wins y obligatorias preservadas | `.agents/skills/projectctl-requirements/references/tasks/binding.md` JSON Pointer `/task_skill_selection` + identifiers `lanes[sdd-apply-code-*]`, `lanes[sdd-verify-code]`, `gates[code_review_passed]`; runtime projections in `.agents/skills/projectctl-requirements/modules/sd-protocol/workflow-runtime-context.md` y `.agents/skills/projectctl-requirements/modules/sd-protocol/skill-resolver.md` | n/a (bundle owned by WU-04) | n/a | `frontend/__tests__/coordinator-state-machine.test.ts` + `scripts/sdd-executor-delegation.test.ts` | `2026-09-10` |
| `PCT-112` | Boundary de tests y cobertura mínima de Fase 3 | `.agents/skills/projectctl-requirements/references/tasks/binding.md` identifiers `lanes[sdd-apply-unit-tests|sdd-apply-pwauto-tests|sdd-verify-units|sdd-verify-pwauto|sdd-verify-pwcli]` + `gates[coverage_gate_passed]` | n/a (bundle owned by WU-04) | n/a | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` | `2026-09-10` |
| `PCT-113` | Fase documental obligatoria y entrega condicional; RDD opt-in se resuelve exclusivamente desde el binding | `.agents/skills/projectctl-requirements/references/tasks/binding.md` identifiers `lanes[sdd-apply-doc]`, `phases[id=fase_4_documentacion]`, `phases[id=fase_5_rdd]`, `modes.rdd_mode`; JSON Pointer `/delivery` | n/a (bundle owned by WU-04) | n/a | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` + `frontend/__tests__/coordinator-state-machine.test.ts` | `2026-09-10` |
| `PCT-114` | Separación entre tab global informativa y workspace mutable | `.agents/skills/projectctl-requirements/references/tasks/binding.md` JSON Pointer `/active_sources/include` | n/a (bundle owned by WU-04) | `/projectctl?tab=tareas` + `/project/[id]` | `frontend/__tests__/projectctl-tareas-bundle.test.ts` | `2026-09-10` |
| `PCT-115` | Aprobación explícita y branch gate (`AC-010.passed_and_branch_available`) | `.agents/skills/projectctl-requirements/references/tasks/binding.md` identifiers `gates[AC-010.*]` + `controls[id=branch_creation_pending]` | n/a (bundle owned by WU-04) | `branch_creation_pending` | `frontend/__tests__/coordinator-state-machine.test.ts` | `2026-09-10` |
| `PCT-116` | Aceptación funcional antes de cobertura | `.agents/skills/projectctl-requirements/references/tasks/binding.md` identifier `gates[functional_acceptance_*]` | n/a (bundle owned by WU-04) | n/a | `frontend/__tests__/coordinator-state-machine.test.ts` | `2026-09-10` |
| `PCT-117` | Branch-only y entrega ordenada; en RDD opt-in cada boundary consume el gate read-only declarado por el binding | `.agents/skills/projectctl-requirements/references/tasks/binding.md` JSON Pointer `/delivery` | n/a (bundle owned by WU-04) | `delivery.action_order` | `frontend/__tests__/coordinator-state-machine.test.ts` | `2026-09-10` |
| `PCT-118` | Eliminación dura del contrato sustituido y de catálogos duplicados | `.agents/skills/projectctl-requirements/references/tasks/binding.md` JSON Pointers `/retired_aliases` + `/active_sources/exclude` | n/a (bundle owned by WU-04) | n/a | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` | `2026-09-10` |
| `PCT-119` | Trazabilidad AC↔PCT sin alterar el baseline | `.agents/skills/projectctl-requirements/references/tasks/binding.md` machine block identifier `task-flow-binding`; mapping published in `docs/app-map/views/projectctl/features/tareas.md` heading `Trazabilidad` | `docs/app-map/views/projectctl/features/tareas.md` | n/a | `frontend/__tests__/projectctl-tareas-bundle.test.ts` | `2026-09-10` |
| `PCT-120` | Envelopes no vacíos y routing por fase (`status`/`phase`/`state`/`sections_touched`/`criteria_covered`) | `.agents/skills/projectctl-requirements/references/tasks/binding.md` JSON Pointers `/status` + `/phases`; envelope contract in `.agents/skills/projectctl-requirements/modules/sd-protocol/workflow-runtime-context.md` | n/a (bundle owned by WU-04) | n/a | `frontend/__tests__/coordinator-state-machine.test.ts` | `2026-09-10` |
| `PCT-121` | Precedencia del taskReadme/phase artifacts; `rdd-report` es proyección no autoritativa y no sustituye receipts ni recovery | `.agents/skills/projectctl-requirements/references/tasks/binding.md` JSON Pointers `/artifact_store` + `/active_sources/include` | n/a (bundle owned by WU-04) | n/a (filesystem-only) | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` + `frontend/__tests__/task-template.test.ts` | `2026-09-10` |

> **Block trace**: el binding integral está delimitado por los marcadores `<!-- task-flow-binding:start -->` y `<!-- task-flow-binding:end -->` dentro de `.agents/skills/projectctl-requirements/references/tasks/binding.md` v10.0.0.

### Criterios nuevos 2026-09-07 — backfill + reglas (PCT-149..155, TST-38, AC-329)

> Filas del backfill de 21 criterios (G-8, born-typed con el shape post-rollout
> `{id, title, functional, coverage, type}`) y de las reglas R-B/R-C. El catálogo completo de
> cada criterio vive en su bundle (principio anti-duplicación: esta tabla cita paths, NO
> reproduce catálogos). Los 9 criterios de esta sección son los del scope `/projectctl` + tab
> Test de esta tabla; los demás criterios nuevos del backfill (`PRJ-100..107`,
> `TNL-30..32`, `MDL-63`) viven en bundles de otras vistas (`project-workspace`,
> `tunnel-management`, `models`) fuera del alcance `/projectctl` de esta tabla — su SoT es su
> bundle. Los títulos en `Requisito` son verbatim del bundle (pinned por
> `scripts/app-map-criteria-types.test.ts`).

| ID | Requisito | SoT skill path | SoT bundle path | SoT CLI/API/Runtime | SoT test path | last-verified |
| --- | --- | --- | --- | --- | --- | --- |
| `PCT-149` | Regla spawn: `spawn(cmd, args, {shell:false})`, NUNCA `exec()` ni `shell:true` | `AGENTS.md` (regla #1) | `docs/app-map/views/projectctl/features/entorno.md` | `sandbox/src/services/spawn.ts` + `sandbox/src/bin/projectctl.ts` + `scripts/test-runner.ts` | `scripts/app-map-criteria-types.test.ts` | `2026-09-07` |
| `PCT-150` | `/activity` expone trail de auditoría (PCT-72/73) con consumidor declarado | n/a (filesystem) | `docs/app-map/views/projectctl/index.md` | `api/src/routes/activity.ts` | `scripts/app-map-criteria-types.test.ts` | `2026-09-07` |
| `PCT-151` | Familia `/internal/*` token-gated fail-closed; legacy test-runs preservado | n/a (filesystem) | `docs/app-map/views/projectctl/features/cli.md` | `api/src/index.ts` | `api/src/routes/__tests__/internal-projectctl.test.ts` + `scripts/app-map-criteria-types.test.ts` | `2026-09-07` |
| `PCT-152` | Wrapper `projectctl-root`: bridge autenticado sin credencial por uso (lane `/internal`) | `.agents/skills/projectctl-requirements/modules/projectctl-root/module.md` | `docs/app-map/views/projectctl/features/cli.md` | `scripts/projectctl-root.ts` | `scripts/app-map-criteria-types.test.ts` | `2026-09-10` |
| `PCT-153` | El webhook central aplica autenticación y allowlist configuradas por el operador | `AGENTS.md` (regla #7) | `docs/app-map/views/projectctl/features/entorno.md` | `webhook-listener/src/handlers/webhook.js` + `webhook-listener/src/listener.js` + `webhook-listener/src/config.js` | `scripts/app-map-criteria-types.test.ts` | `2026-09-10` |
| `PCT-154` | Contrato bidireccional código⇒criterio con procedimiento de auditoría en close | `.agents/skills/projectctl-requirements/references/standard.md` §1 + `.agents/skills/projectctl-requirements/references/doc.md` (PCT-85) | `docs/app-map/views/projectctl/features/doc.md` | `scripts/docs-lint.ts` (mitad mecánica código⇒criterio) | `scripts/app-map-criteria-types.test.ts` | `2026-09-07` |
| `PCT-155` | La proposal declara el delta de criterios con IDs | `.agents/skills/projectctl-requirements/modules/sdd/sdd-propose/module.md` + `.agents/skills/projectctl-requirements/references/standard.md` §5 | `docs/app-map/views/projectctl/features/tareas.md` | n/a (taskReadme/coordinator contract) | `scripts/app-map-criteria-types.test.ts` | `2026-09-10` |
| `TST-38` | `docs-lint` valida trazabilidad código⇒criterio contra SoT `docs/app-map` (checks 1-5) | n/a (filesystem) | `docs/app-map/views/project-workspace/features/test-tab.md` | `scripts/docs-lint.ts` | `scripts/app-map-criteria-types.test.ts` | `2026-09-07` |
| `AC-329` | La auditoría doc⇒código verifica que cada criterio declarado tiene evidencia o justificación | `.agents/skills/projectctl-requirements/references/standard.md` §1 | `docs/app-map/views/project-workspace/features/test-tab.md` | `scripts/docs-lint.ts` (mitad mecánica) | `scripts/app-map-criteria-types.test.ts` | `2026-09-07` |

---

### Apartado de criterios (PCT-169..PCT-174)

| ID | Requisito | SoT skill path | SoT bundle path | SoT CLI/API/Runtime | SoT test path | last-verified |
| --- | --- | --- | --- | --- | --- | --- |
| `PCT-169` | Tab criterios, posición y routing fail-closed | `.agents/skills/projectctl-requirements/references/criterios.md` (índice derivado) + `.agents/skills/projectctl-requirements/references/decisions.md` D-8 | `docs/app-map/views/projectctl/features/criterios.md` | `frontend/src/views/projectctl/lib/resolve-tab.ts` | `tests/e2e/projectctl/tabs.spec.ts` | `2026-09-20` |
| `PCT-170` | Autoridad inline y referencia derivada cita-no-copia | `.agents/skills/projectctl-requirements/references/criterios.md` (índice derivado) + `.agents/skills/projectctl-requirements/references/decisions.md` D-3/D-5 | `docs/app-map/views/projectctl/features/criterios.md` | n/a | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` | `2026-09-20` |
| `PCT-171` | Distinción de enums PCT/App Map y mapping preservado | `.agents/skills/projectctl-requirements/references/criterios.md` (índice derivado) + `.agents/skills/projectctl-requirements/references/estructura.md` | `docs/app-map/views/projectctl/features/criterios.md` | n/a | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` | `2026-09-20` |
| `PCT-172` | Ledger de coverage separado de la autoridad `criteria[]` | `.agents/skills/projectctl-requirements/references/criterios.md` (índice derivado) + `.agents/skills/projectctl-requirements/references/standard.md` §2 | `docs/app-map/views/projectctl/features/criterios.md` | n/a | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` | `2026-09-20` |
| `PCT-173` | Sources de la tab con citas sin republicación | `.agents/skills/projectctl-requirements/references/criterios.md` (índice derivado) | `docs/app-map/views/projectctl/features/criterios.md` | `frontend/src/views/projectctl/ui/TabSources.tsx` | `tests/e2e/projectctl/tabs.spec.ts` | `2026-09-20` |
| `PCT-174` | Bundle, par Mermaid y proyecciones coherentes | `.agents/skills/projectctl-requirements/references/criterios.md` (índice derivado) + `.agents/skills/projectctl-requirements/references/standard.md` §1 | `docs/app-map/views/projectctl/features/criterios.md` + `docs/app-map/views/projectctl/features/criterios.mmd` | `scripts/projectctl-docs.ts` | `frontend/__tests__/projectctl-doc-bundle.test.ts` | `2026-09-20` |
| `PCT-175` | `projectctl criteria check` valida calidad semántica MVP y preserva autoridad inline/cita-no-copia | `.agents/skills/projectctl-requirements/SKILL.md` + `.agents/skills/projectctl-requirements/references/criterios.md` | `docs/app-map/views/projectctl/index.md` | `projectctl criteria check` + `scripts/projectctl-criteria-integrity.ts` | `scripts/projectctl-criteria-integrity.test.ts` | `2026-09-21` |

---

## Reglas machine-grepeable (para validación automatizada)

> Estas reglas mantienen formato machine-grepeable para herramientas futuras. El test actual solo aplica sus checks explícitos y acotados; no garantiza cada regla mediante un scanner genérico.

1. **Todo path en este archivo que es filesystem-referente va entre backticks** con extensión que coincida con la regex `/`(.[^`]+\.(ts|tsx|md|json|ya?ml|sh))`/g`.
2. **Comandos CLI van entre backticks con prefijo `projectctl`** (ej. `` `projectctl env validate` ``); los args después del comando van en el mismo backtick. Si la salida del comando incluye paths, esos paths van en su propio par de backticks.
3. **Rutas API van entre backticks con prefijo `/api/`** (ej. `` `GET /api/projects/{id}/docs/app-map` ``). Las variables entre `{}` van literales (NO se interpolan en runtime).
4. **`last-verified` por entry, formato `YYYY-MM-DD`**. Si una entry tiene el mismo `last-verified` que sus vecinas pero uno de los paths citados cambió, regenerar entry-specific.
5. **Toda entry que cite una skill inexistente en el repo destino** debe mantener un aviso explícito "skill no encontrada en este repo; verifique localmente" (ADDED-SKILL-005). El aviso se considera parte del contenido, no de la SoT.

## Criterios cubiertos por este archivo

`PCT-89..PCT-121` + criterios nuevos `PCT-149..PCT-155`, `TST-38`, `AC-329`, `PCT-175` (secciones "Criterios nuevos 2026-09-07 — backfill + reglas" y "Apartado de criterios").

(Véase `.agents/skills/projectctl-requirements/references/tasks/binding.md` v10.0.0 para el bloque integral `task-flow-binding`.)
