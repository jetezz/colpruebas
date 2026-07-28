---
file: references/sources.md
parent_skill: projectctl-requirements
owner: WU-04 (apply-code-high)
purpose: machine-grepeable SoT table for all PCT-89..PCT-121 + cross-tab/standard requirements
sot_policy: canonical-standard
last_full_regen: 2026-07-24
generated_by: sdd-apply-code-high (WU-04) — sdd/20260722-tskflow-centralizar-flujo-tareas-sdd/apply-code-high-WU-04
binding_role: cites_task_flow_binding_block_only
---

# `.agents/skills/projectctl-requirements/references/sources.md` — Tabla SoT machine-grepeable

> **Tabla normativamente vinculante** para el contenido de la skill `projectctl-requirements`. Cualquier divergencia entre esta tabla y lo que el agente runtime observa en los archivos de `references/` (los 9 archivos `.md` que viven bajo ese directorio: cli, doc, test, entorno, tareas, standard, sources, maintenance, decisions) resuelve a favor de esta tabla hasta la próxima `sdd-spec` delta que la modifique.
>
> La tabla mantiene paths en inline-code para trazabilidad. `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` verifica un conjunto explícito y acotado de paths e invariantes; no escanea genéricamente cada cita de esta tabla.

## Rol respecto al bloque `task-flow-binding`

Este archivo no duplica valores del bloque `task-flow-binding` (`TaskFlowBindingV1`, v8.0.0).

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

## Cómo lo lee `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts`

La suite actual enumera los paths canónicos que deben existir y valida explícitamente locator, identidad del binding/projections, `active_sources`, aliases retirados y ausencia de catálogos duplicados. El snippet histórico siguiente no es el contrato actual y se retira para evitar afirmar un scanner genérico inexistente.

Cada garantía nueva debe aparecer como una aserción dedicada; no hay promesa de cobertura exhaustiva sobre todos los backticks.

---

## Tabla SoT por criterio (PCT-89..PCT-100 + cross-tab/skill)

> Cada fila es 1 criterio. Columnas:
>
> - `PCT ID` — criterio del view `/projectctl` (rango PCT-79..PCT-105).
> - `Requisito` — qué debe ser cierto (resumen 1 línea).
> - `SoT skill path` — skill referenciada (inline-code; valida como existente).
> - `SoT bundle path` — bundle documental SoT (inline-code; valida como existente).
> - `SoT CLI/API/Runtime` — comando CLI, ruta API o servicio runtime asociado (inline-code cuando aplica).
> - `SoT test path` — path del test que valida el requisito (inline-code; puede ser `n/a` si solo validable por `sot-coherence`).
> - `last-verified` — fecha YYYY-MM-DD de última regeneración; bumpear ante cualquier cambio en cualquier SoT cell de la fila.

### Tab Test (PCT-89..PCT-94)

| PCT ID | Requisito | SoT skill path | SoT bundle path | SoT CLI/API/Runtime | SoT test path | last-verified |
| --- | --- | --- | --- | --- | --- | --- |
| `PCT-89` | Panel Test existe y lista reglas del sistema de testing | `.agents/skills/projectctl-requirements/references/standard.md` §2 | `docs/app-map/views/project-workspace/features/test-tab.md` | n/a (filesystem) | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` + `frontend/__tests__/projectctl-test-bundle.test.ts` | `2026-07-24` |
| `PCT-90` | Contrato AC mandatorio (`// @ac` + `test.info().annotations.push`) | `.agents/skills/projectctl-requirements/references/standard.md` §2 | `docs/app-map/views/project-workspace/features/test-tab.md` | `scripts/test-runner.ts` | `frontend/__tests__/TestPanel.quickrun-top-level-view.test.ts` | `2026-07-24` |
| `PCT-91` | Runner unificado + mapping 1:1 con `projectctl test *` (PCT-75..78) | `.agents/skills/projectctl-requirements/references/standard.md` §2 + `.agents/skills/projectctl-requirements/references/standard.md` §4 | `docs/app-map/views/projectctl/index.md` (PCT-75..PCT-78) | `scripts/test-runner.ts` + `sandbox/src/bin/projectctl.ts` | `frontend/__tests__/projectctl-test-bundle.test.ts` | `2026-07-24` |
| `PCT-92` | Persistencia `.runtime/test-results/<projectId>/<run-id>/` + write-back atómico via `patchBundleCoverage` (TST-04, TST-08, TST-11) | `.agents/skills/projectctl-requirements/references/standard.md` §2 | `docs/app-map/views/project-workspace/features/test-tab.md` | `sandbox/src/services/test-results-writer.ts` | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` | `2026-07-24` |
| `PCT-93` | Gate `bun run test:check` (TST-13) + layout/discovery canónicos (TST-36) | `.agents/skills/projectctl-requirements/references/standard.md` §2 | `docs/app-map/views/project-workspace/features/test-tab.md` | `playwright.config.ts` + `scripts/test-runner.ts` | `frontend/__tests__/projectctl-test-bundle.test.ts` | `2026-07-24` |
| `PCT-94` | References: `playwright/TEST_PLAN.md` mapping + integrated testing policy | `.agents/skills/projectctl-requirements/references/standard.md` §2 | `docs/app-map/views/project-workspace/features/test-tab.md` | `playwright/TEST_PLAN.md` | `frontend/__tests__/projectctl-test-bundle.test.ts` | `2026-07-24` |

### Tab Entorno (PCT-95..PCT-100)

| PCT ID | Requisito | SoT skill path | SoT bundle path | SoT CLI/API/Runtime | SoT test path | last-verified |
| --- | --- | --- | --- | --- | --- | --- |
| `PCT-95` | Panel Entorno existe y lista reglas para arrancar + ser publicable + tunnel | `.agents/skills/projectctl-requirements/references/standard.md` §3 + `.agents/skills/sandbox-runtime-policy/SKILL.md` | `docs/00-context/entornos.md` | n/a (filesystem) | `frontend/__tests__/projectctl-entorno-bundle.test.ts` | `2026-07-24` |
| `PCT-96` | Overlays canónicos (`compose.yml` prod + `compose.dev.yml` dev) | `.agents/skills/projectctl-requirements/references/standard.md` §3 | `docs/00-context/entornos.md` + `docs/00-context/architecture.md` | `compose.yml` + `compose.dev.yml` + `.env.example` | `frontend/__tests__/projectctl-entorno-bundle.test.ts` | `2026-07-24` |
| `PCT-97` | Puertos canónicos + `FRONTEND_PORT` obligatorio en `.env` y `.env.dev` | `.agents/skills/projectctl-requirements/references/standard.md` §3 | `docs/app-map/views/projectctl/index.md` (PCT-35) | `projectctl env validate` (PCT-35) + `compose.yml` + `.env.example` | `frontend/__tests__/projectctl-entorno-bundle.test.ts` | `2026-07-24` |
| `PCT-98` | Contrato edge `mis-proyectos-edge` + alias + guardrail `TUNNEL_NOT_PUBLISHABLE` | `.agents/skills/projectctl-requirements/references/standard.md` §3 | `docs/00-context/architecture.md` + `docs/02-features/tunnel.md` + `docs/app-map/views/projectctl/index.md` | `projectctl tunnel status` (PCT-38) + `compose.yml` + `compose.dev.yml` | `frontend/__tests__/projectctl-entorno-bundle.test.ts` | `2026-07-24` |
| `PCT-99` | Sandbox sin Docker CLI/socket — control de runtime exclusivamente via `projectctl` | `.agents/skills/sandbox-runtime-policy/SKILL.md` + `.agents/skills/projectctl-requirements/references/standard.md` §3 + `.agents/skills/projectctl-requirements/references/standard.md` §4 | `docs/app-map/views/projectctl/index.md` (PCT-30..PCT-45) | `sandbox/src/bin/projectctl.ts` | `frontend/__tests__/projectctl-entorno-bundle.test.ts` | `2026-07-24` |
| `PCT-100` | References: integrated runtime policy in `projectctl-requirements` | `.agents/skills/projectctl-requirements/references/standard.md` §3 | `docs/04-process/development.md` + `docs/02-features/tunnel.md` | n/a | `frontend/__tests__/projectctl-entorno-bundle.test.ts` | `2026-07-24` |

### Cross-tab + skill portability (PCT-101..PCT-105 — extracto; tabla completa en `.agents/skills/projectctl-requirements/references/maintenance.md` y en los archivos `.md` de `references/` para `cli` y `doc` por WU-SKILL-1)

| PCT ID | Requisito | SoT skill path | SoT bundle path | SoT CLI/API/Runtime | SoT test path | last-verified |
| --- | --- | --- | --- | --- | --- | --- |
| `PCT-101` | 5 tabs internos en orden fijo `cli → doc → test → entorno → tareas` | `.agents/skills/frontend-policy/SKILL.md` + `.agents/skills/fsd-architecture/SKILL.md` | `docs/app-map/views/projectctl/index.md` + `docs/app-map/navigation.yaml` | `frontend/src/views/projectctl/ui/ProjectctlView.tsx` + `frontend/src/views/projectctl/stores/tabs.store.ts` | `tests/e2e/projectctl/tabs.spec.ts` | `2026-07-24` |
| `PCT-102` | Cada tab MUST citar sources en un bloque aside con `data-testid="projectctl-tab-sources-<tab>"` (kebab-case; tab id ∈ `cli | doc | test | entorno | tareas`) | `.agents/skills/frontend-policy/SKILL.md` | `docs/app-map/views/projectctl/features/{cli,doc,test,entorno,tareas}.md` | `frontend/src/views/projectctl/ui/TabSources.tsx` | `tests/e2e/projectctl/tabs.spec.ts` | `2026-07-24` |
| `PCT-103` | El bundle raíz `index.md` preserva PCT-01..78 + tabla de mapeo a bundles por tab | `.agents/skills/projectctl-requirements/references/standard.md` heading `Documentación y app-map` | `docs/app-map/views/projectctl/index.md` + `docs/app-map/views/projectctl/features/{cli,doc,test,entorno,tareas}.md` | n/a | `frontend/__tests__/projectctl-doc-bundle.test.ts` + `frontend/__tests__/projectctl-test-bundle.test.ts` + `frontend/__tests__/projectctl-entorno-bundle.test.ts` + `frontend/__tests__/projectctl-tareas-bundle.test.ts` | `2026-07-24` |
| `PCT-104` | `data-testid` discipline kebab-case `<purpose>-<scope>` | `.agents/skills/frontend-policy/SKILL.md` + `.agents/skills/fsd-architecture/SKILL.md` | `docs/app-map/views/projectctl/index.md` | `frontend/src/views/projectctl/ui/ProjectctlView.tsx` | `frontend/__tests__/projectctl-tabs.test.ts` | `2026-07-24` |
| `PCT-105` | Paquete copiable sin modificaciones + Maintenance contract + prerequisitos de instalación explícitos | `.agents/skills/skill-creator/SKILL.md` + `.agents/skills/projectctl-requirements/references/standard.md` + `.agents/skills/coordinador/SKILL.md` | `docs/00-context/agents_skills.md` + `docs/04-process/task.md` | n/a (filesystem-only) | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` (presente) | `2026-07-24` |

### Task flow binding (PCT-106..PCT-121)

> El binding integral vive en el bloque delimitado `task-flow-binding` (`TaskFlowBindingV1`, v8.0.0) dentro de `.agents/skills/projectctl-requirements/references/tareas.md`.

| PCT ID | Requisito | SoT skill path | SoT bundle path | SoT CLI/API/Runtime | SoT test path | last-verified |
| --- | --- | --- | --- | --- | --- | --- |
| `PCT-106` | Creación con exactamente `task.required_inputs` obligatorios (binding integral) | `.agents/skills/projectctl-requirements/references/tareas.md` JSON Pointer `/task/required_inputs` | n/a (bundle owned by WU-04) | n/a (taskReadme/coordinator contract) | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` | `2026-07-24` |
| `PCT-107` | Identidad, naming, `task.file_pattern`, `task.id_pattern`, `task.slug_pattern`, `delivery.branch_pattern` | `.agents/skills/projectctl-requirements/references/tareas.md` JSON Pointers `/task` + `/delivery/branch_pattern` | n/a (bundle owned by WU-04) | n/a (taskReadme/coordinator contract) | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` | `2026-07-24` |
| `PCT-108` | `artifact_store.primary` (role index + `index_budget`), `artifact_store.phase_artifacts`, empty `mirrors[]`, `write_order` | `.agents/skills/projectctl-requirements/references/tareas.md` JSON Pointer `/artifact_store` | n/a (bundle owned by WU-04) | n/a (filesystem-only) | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` | `2026-07-24` |
| `PCT-109` | Cuatro fases, states por fase y `controls[]` (branch/final_*/done/blocked/failed) | `.agents/skills/projectctl-requirements/references/tareas.md` JSON Pointers `/phases` + `/controls` | n/a (bundle owned by WU-04) | n/a (taskReadme state contract) | `frontend/__tests__/coordinator-state-machine.test.ts` | `2026-07-24` |
| `PCT-110` | Contrato, agentes, gate y loops de Fase 1 | `.agents/skills/projectctl-requirements/references/tareas.md` identifiers `phases[id=fase_1_propuesta]` + `gates[AC-010.*]` | n/a (bundle owned by WU-04) | n/a | `frontend/__tests__/coordinator-state-machine.test.ts` | `2026-07-24` |
| `PCT-111` | Boundary de lanes, skill lógica implementadora, rigor apply-code, code review y aceptación de Fase 2 | `.agents/skills/projectctl-requirements/references/tareas.md` identifiers `lanes[sdd-apply-code-*]`, `lanes[sdd-verify-code]`, `gates[code_review_passed]`; runtime projections in `.agents/skills/sd-protocol/workflow-runtime-context.md` and `.agents/skills/sd-protocol/skill-resolver.md` | n/a (bundle owned by WU-04) | n/a | `frontend/__tests__/coordinator-state-machine.test.ts` + `scripts/sdd-executor-delegation.test.ts` | `2026-07-24` |
| `PCT-112` | Boundary de tests y cobertura mínima de Fase 3 | `.agents/skills/projectctl-requirements/references/tareas.md` identifiers `lanes[sdd-apply-unit-tests|sdd-apply-pwauto-tests|sdd-verify-units|sdd-verify-pwauto|sdd-verify-pwcli]` + `gates[coverage_gate_passed]` | n/a (bundle owned by WU-04) | n/a | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` | `2026-07-24` |
| `PCT-113` | Fase 4 obligatoria, owner único (`sdd-apply-doc`) y gate antes de entrega | `.agents/skills/projectctl-requirements/references/tareas.md` identifiers `lanes[sdd-apply-doc]`, `phases[id=fase_4_documentacion]`, `gates[documentation_gate_passed]`; JSON Pointer `/delivery/action_order` | n/a (bundle owned by WU-04) | n/a | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` | `2026-07-24` |
| `PCT-114` | Separación entre tab global informativa y workspace mutable | `.agents/skills/projectctl-requirements/references/tareas.md` JSON Pointer `/active_sources/include` | n/a (bundle owned by WU-04) | `/projectctl?tab=tareas` + `/project/[id]` | `frontend/__tests__/projectctl-tareas-bundle.test.ts` | `2026-07-24` |
| `PCT-115` | Aprobación explícita y branch gate (`AC-010.passed_and_branch_available`) | `.agents/skills/projectctl-requirements/references/tareas.md` identifiers `gates[AC-010.*]` + `controls[id=branch_creation_pending]` | n/a (bundle owned by WU-04) | `branch_creation_pending` | `frontend/__tests__/coordinator-state-machine.test.ts` | `2026-07-24` |
| `PCT-116` | Aceptación funcional antes de cobertura | `.agents/skills/projectctl-requirements/references/tareas.md` identifier `gates[functional_acceptance_*]` | n/a (bundle owned by WU-04) | n/a | `frontend/__tests__/coordinator-state-machine.test.ts` | `2026-07-24` |
| `PCT-117` | Branch-only para cambios de la task y entrega ordenada | `.agents/skills/projectctl-requirements/references/tareas.md` JSON Pointer `/delivery` | n/a (bundle owned by WU-04) | `delivery.action_order` (`final_commit_pending` → `final_push_pending` → `final_pr_pending`) | `frontend/__tests__/coordinator-state-machine.test.ts` | `2026-07-24` |
| `PCT-118` | Eliminación dura del contrato sustituido y de catálogos duplicados | `.agents/skills/projectctl-requirements/references/tareas.md` JSON Pointers `/retired_aliases` + `/active_sources/exclude` | n/a (bundle owned by WU-04) | n/a | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` | `2026-07-24` |
| `PCT-119` | Trazabilidad AC↔PCT sin alterar el baseline | `.agents/skills/projectctl-requirements/references/tareas.md` machine block identifier `task-flow-binding`; mapping published in `docs/app-map/views/projectctl/features/tareas.md` heading `Trazabilidad` | `docs/app-map/views/projectctl/features/tareas.md` | n/a | `frontend/__tests__/projectctl-tareas-bundle.test.ts` | `2026-07-24` |
| `PCT-120` | Envelopes no vacíos y routing por fase (`status`/`phase`/`state`/`sections_touched`/`criteria_covered`) | `.agents/skills/projectctl-requirements/references/tareas.md` JSON Pointers `/status` + `/phases`; envelope contract in `.agents/skills/sd-protocol/workflow-runtime-context.md` | n/a (bundle owned by WU-04) | n/a | `frontend/__tests__/coordinator-state-machine.test.ts` | `2026-07-24` |
| `PCT-121` | Precedencia del taskReadme activo y phase artifacts sobre contexto stale o herramientas opcionales | `.agents/skills/projectctl-requirements/references/tareas.md` JSON Pointers `/artifact_store` + `/active_sources/include` | n/a (bundle owned by WU-04) | n/a (filesystem-only) | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` | `2026-07-24` |

> **Block trace**: el binding integral está delimitado por los marcadores `<!-- task-flow-binding:start -->` y `<!-- task-flow-binding:end -->` dentro de `.agents/skills/projectctl-requirements/references/tareas.md` v8.0.0.

---

## Reglas machine-grepeable (para validación automatizada)

> Estas reglas mantienen formato machine-grepeable para herramientas futuras. El test actual solo aplica sus checks explícitos y acotados; no garantiza cada regla mediante un scanner genérico.

1. **Todo path en este archivo que es filesystem-referente va entre backticks** con extensión que coincida con la regex `/`(.[^`]+\.(ts|tsx|md|json|ya?ml|sh))`/g`.
2. **Comandos CLI van entre backticks con prefijo `projectctl`** (ej. `` `projectctl env validate` ``); los args después del comando van en el mismo backtick. Si la salida del comando incluye paths, esos paths van en su propio par de backticks.
3. **Rutas API van entre backticks con prefijo `/api/`** (ej. `` `GET /api/projects/{id}/docs/app-map` ``). Las variables entre `{}` van literales (NO se interpolan en runtime).
4. **`last-verified` por entry, formato `YYYY-MM-DD`**. Si una entry tiene el mismo `last-verified` que sus vecinas pero uno de los paths citados cambió, regenerar entry-specific.
5. **Toda entry que cite una skill inexistente en el repo destino** debe mantener un aviso explícito "skill no encontrada en este repo; verifique localmente" (ADDED-SKILL-005). El aviso se considera parte del contenido, no de la SoT.

## Criterios cubiertos por este archivo

`PCT-89..PCT-121`.

(Véase `.agents/skills/projectctl-requirements/references/tareas.md` v8.0.0 para el bloque integral `task-flow-binding`.)
