---
title: "Demos visuales del estándar projectctl-requirements en colpruebas"
task_id: "20260904-7j2qr"
task_slug: "demos-visuales-projectctl-requirements"
sdd_change_id: "20260904-7j2qr-demos-visuales-projectctl-requirements"
binding_id: "projectctl-requirements.task-flow"
binding_version: "9.0.0"
binding_path: ".agents/skills/projectctl-requirements/references/tareas.md"
sdd_persistence: "taskReadme index + phase artifacts"
phase_artifacts_dir: "taskReadme/20260904-7j2qr-demos-visuales-projectctl-requirements/"
status: pending
phase: null
state: pending
priority: medium
type: feature
area: fullstack
created: 2026-09-04T08:45:00Z
updated: 2026-09-04T08:45:00Z
source_branch: develop
target_branch: develop
branch_name: "feature/20260904-7j2qr-demos-visuales-projectctl-requirements"
pr_url: ""
browser_validation: required
docker_validation: not_required
docs_impact: updated
blocked_reason: ""
---

# Task: Demos visuales del estándar `projectctl-requirements` en colpruebas

> **Origen de los valores**: este índice es coordinación del binding `projectctl-requirements.task-flow` v9.0.0. El detalle full de cada fase vive en `taskReadme/20260904-7j2qr-demos-visuales-projectctl-requirements/`.

## 1. Objetivo

Convertir a `colpruebas` en un **terreno de prueba visual completo** del estándar `.agents/skills/projectctl-requirements/` (tabs `cli | doc | test | entorno | tareas`), cerrando los gaps de UI que hoy impiden comprobar las funcionalidades "con los ojos": la tab Test está declarada `implemented` pero no renderiza sus componentes, y las áreas `cli`, `entorno` y `tareas` quedan como `not-applicable` para un repo consumidor porque su UI vive en la plataforma.

> **Ownership**: `coordinator` (per `binding.task.heading_owners["1_objetivo"]`).

## 2. Contexto operativo / Justificación

- **Origen del pedido**: iniciativa de testing del usuario (feature).
- **Motivación (problema actual)**:
  - La UI de la tab Test (`PWT-01..PWT-12`) está marcada `functional: implemented` en el bundle, pero la página `/project/{id}?tab=test` renderiza solo los criterios del bundle — los e2e PW-AUTO fallan porque no existen `[data-testid="test-tab-section-quickrun"]`, `test-tab-quickrun-legend` ni `[data-action="pwcli"]`. Se prueba el std de testing por el lado del runner/gate, pero **no visualmente**.
  - Los contratos `cli` (PCT-79..82), `entorno` (PCT-95..100) y `tareas` (PCT-106..121) son `not-applicable` para el consumidor: su UI pertenece a la plataforma. Al ser este repo un banco de pruebas del estándar, conviene **replicar vistas demo locales** (con criterios propios) que ejerciten esos contratos sin depender de la plataforma.
- **Restricciones**:
  - `docs/app-map/**` sigue siendo la única superficie funcional consumida por UI; toda vista demo nueva necesita bundle + `criteria[]` + `navigation.yaml` (prefix discipline).
  - El write-back de cobertura es vía runner (`--persist`), nunca edición manual del frontmatter (PCT-92 / W1).
  - El gate `bun run test:check` (TST-13/AD-08) debe quedar verde; ningún criterio `implemented` puede tener `Unit` y `PW-AUTO` ambos en `missing`.
  - `mirrors: []` (binding); recovery y evidencia viven en este índice y sus phase artifacts.

> **Ownership**: `coordinator` (per `binding.task.heading_owners["2_contexto_operativo"]`).

## 3. Criterios de aceptación

Prosa completa en `taskReadme/20260904-7j2qr-demos-visuales-projectctl-requirements/spec.md`.

| AC-ID | Veredicto | Método |
| --- | --- | --- |
| `AC-DV-01` | `pending` | `PW-AUTO` |
| `AC-DV-02` | `pending` | `PW-CLI` |
| `AC-DV-03` | `pending` | `PW-AUTO` |
| `AC-DV-04` | `pending` | `Manual` |
| `AC-DV-05` | `pending` | `Unit` |
| `AC-DV-06` | `pending` | `Manual` |

Definición:
- `AC-DV-01`: la tab Test renderiza leyenda de 8 estados, lista de criterios con chips, botones per-criterio PW-CLI y Manual, y reset coverage con modal (PWT-01..PWT-12).
- `AC-DV-02`: el ciclo PW-CLI simulado desde la UI escribe coverage real visible al recargar (PWT-08/PWT-09/Manual).
- `AC-DV-03`: la vista demo Catálogo CLI renderiza las 12 familias con filtro y copiado al portapapeles (PCT-79..82) usando la metadata del binario.
- `AC-DV-04`: la vista demo Entorno muestra dev/prod, puertos y túnel (domains, token, publishability) (PCT-95..100).
- `AC-DV-05`: la vista demo Tareas muestra tasks del binding en sus estados/fases/gates (PCT-106..121).
- `AC-DV-06`: bundles y criteria de los nuevos DEMO quedan registrados y el gate `test:check` pasa (PCT-83..88, PCT-93).

- `criteria_covered`: `AC-DV-01..AC-DV-06` (per `binding.gates["AC-006.criteria_covered"]`).

> **Ownership**: `coordinator` (per `binding.task.heading_owners["3_criterios_de_aceptacion"]`).

## 4. Fases

| Fase | Estado | Resumen (≤10 líneas) | Artefacto |
| --- | --- | --- | --- |
| Exploración | `pending` | Relevar componentes data-testid faltantes en frontend y contractos pwauto/pwcli activables; confirmar puntos de inserción de vistas demo. | `taskReadme/20260904-7j2qr-demos-visuales-projectctl-requirements/explore-code.md` |
| Propuesta | `pending` | Alcance de las 4 demo views + UI tab Test real; criterios DEMO-* con functional states variados. | `.../proposal.md` |
| Specs | `pending` | SC-DV-001..SC-DV-00X con criterios, evidencia y AC mapping. | `.../spec.md` |
| Design | `pending` | Layout Astro/FSD de las vistas, data-testid tandem, integración con runner persiste. | `.../design.md` |
| Tasks | `pending` | 5 work units (ver §5). | `.../tasks.md` |

> **Ownership**: `coordinator` (per `binding.task.heading_owners["4_fases"]`).

## 5. Work units

Desglose full (13 columnas + campos contractuales) en `taskReadme/20260904-7j2qr-demos-visuales-projectctl-requirements/tasks.md`; schema en `.agents/skills/sd-protocol/apply-work-unit-schema.md`.

| WU-id | Lane | apply_lane | Estado | Artefacto de evidencia |
| --- | --- | --- | --- | --- |
| `WU-DV-1` | `sdd-apply-code-medium` | `code-medium` | `pending` | UI real Tab Test (quickrun+legend+reset+PW-CLI+Manual) con data-testids (PWT-01..12). |
| `WU-DV-2` | `sdd-apply-code-low` | `code-low` | `pending` | Vista demo Catálogo CLI: 12 familias, filtro, copy (PCT-79..82). |
| `WU-DV-3` | `sdd-apply-code-low` | `code-low` | `pending` | Vista demo Entorno: dev/prod, puertos, túnel y publishability (PCT-95..100). |
| `WU-DV-4` | `sdd-apply-code-medium` | `code-medium` | `pending` | Vista demo Tareas (binding states) + sección 5.3 programadas real (PCT-106..121, PCT-91). |
| `WU-DV-5` | `sdd-apply-doc` | `doc` | `pending` | Bundles + `criteria[]` DEMO-*, navigation.yaml, playbook doc (PCT-83..88). |

> **Ownership**: `coordinator` (per `binding.task.heading_owners["5_work_units"]`).

## 6. Verificación

- **Estado consolidado**: `pending`
- **Lanes requeridos**: `code, units, pwauto, pwcli` (browser validation requerida: vistas demo + tab test).
- **Método de prueba previsto**:
  - PW-AUTO: specs de las nuevas vistas (`tests/front/tests/*.spec.ts`) contra entorno dev publicado.
  - PW-CLI: flujo manual en browser para los 8 estados y reseteo de coverage.
  - Unit: `bun run test:check` como gate y suite del runner.
- **Refs**: phase artifacts `verify-code.md`, `verify-units.md`, `verify-pwauto.md`, `verify-pwcli.md`, `verify-report.md`.

> **Ownership**: `coordinator` (per `binding.task.heading_owners["6_verificacion"]`).

## 7. Estado actual / Siguiente paso / Handoff

- **Estado actual**: `pending`
- **Fase / State**: `null` / `pending`
- **Siguiente paso**: abrir fase de exploración (`explore-code`) relevando el frontend actual y el estado de los e2e antes de proponer.
- **Handoff para resume**: no aplica (task nueva, sin historial previo).

> **Ownership**: `coordinator` (per `binding.task.heading_owners["7_estado_actual_siguiente_paso_handoff"]`).

## 8. Problemas / Blockers

| Severidad | Problema | Resolución / siguiente paso |
| --- | --- | --- |
| `blocker` | Los e2e PW-AUTO de test-tab fallan: la UI declara `implemented` pero no renderiza los `data-testids` requeridos. | WU-DV-1 implementa la UI; hasta entonces los PWT quedan `PW-AUTO: missing/partial` (honesto). |
| `warning` | El flujo pwauto del runner quedó reparado (flag de reporter inválido, `testDir` legacy, junit path) pero no commiteado en la rama. | Incluir ese fix de infra como parte de WU-DV-1 o commit separado previo. |
| `warning` | Los entornos en la plataforma estuvieron con `enabled:0`; hoy publicados (health ok). A verificar antes de PW-CLI. | Verificar `projectctl check prod/dev` antes de la fase de verificación. |

> **Ownership**: `coordinator` (per `binding.task.heading_owners["8_problemas_blockers"]`).

## 9. Git y PR

- **Rama actual**: `feature/20260904-7j2qr-demos-visuales-projectctl-requirements` (per `binding.delivery.branch_pattern`)
- **PR URL**: pendiente
- **Base target**: `develop` (per `binding.delivery.target_branch`)
- **Estado de PR**: no creado

### Checklist de cierre (gate antes de pasar a `done`)

- [ ] Todas las unidades `apply_lane: code-*` en `done` o `blocked` (tabla §5)
- [ ] Las lanes de verificación requeridas en `passed` o `not_required`
- [ ] Branch + PR registrados arriba
- [ ] Documentación actualizada registrada en el phase artifact `apply-WU-DV-5.md` de doc y reflejada en §4/§5
- [ ] Gate `AC-009.app_map_close` verificado (criterios `añadir` en §3)
- [ ] `verification_revision >= documentation_revision` (per `binding.gates["documentation_gate_passed"]`)
- [ ] Forma terminal única: `status: done`, `phase: null`, `state: "done"` (per `binding.controls["done"].value`)

> **Ownership**: `coordinator` (per `binding.task.heading_owners["9_git_y_pr"]`).