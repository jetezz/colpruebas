---
id: projectctl
title: Projectctl
kind: view
summary: >-
  Vista funcional /projectctl de compatibilidad con el estándar instalado
  `projectctl-requirements` (projectctl-requirements.task-flow v9.0.0). Declara
  el bundle declarativo de las 5 tabs internas `cli | doc | test | entorno |
  tareas` con su contrato `criteria[]` inline (IDs prefijados `PCT-*`, prefix
  discipline PCT-88), la referencia al estándar integrado y los criterios de
  calidad mínimos que un proyecto debe cumplir para que su `docs/app-map/` se
  renderice bien desde la tab Doc del workspace.
source_of_truth: app-map
criteria:
  - id: PCT-79
    title: >-
      La UI interna de /projectctl de la plataforma (no este repo consumidor)
      renderiza la tab cli con el catálogo de comandos agrupado por familia.
    functional: not-applicable
    coverage:
      Unit: not-applicable
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: not-applicable
    notes: >-
      No aplicable a este repo consumidor: el catálogo y la tab cli son
      superficie de la plataforma mis-proyectos
      (frontend/src/views/projectctl/ui/), gobernada por
      frontend-policy/fsd-architecture; este repo solo consume el estándar.
  - id: PCT-80
    title: La tab cli expone filtro por `name` y copia al portapapeles por comando.
    functional: not-applicable
    coverage:
      Unit: not-applicable
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: not-applicable
    notes: Superficie UI de la plataforma; no aplicable a este repo consumidor.
  - id: PCT-81
    title: >-
      El catálogo de comandos del CLI (71 visibles) vive en la SoT
      frontend/src/views/projectctl/data/projectctl-commands.ts (plataforma).
    functional: not-applicable
    coverage:
      Unit: not-applicable
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: not-applicable
    notes: >-
      SoT del catálogo en la plataforma; este repo referencia el estándar sin
      duplicar el catálogo.
  - id: PCT-82
    title: >-
      La tab cli de /projectctl se integra a las tabs de compatibilidad de
      manera navegable y consistente.
    functional: not-applicable
    coverage:
      Unit: not-applicable
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: not-applicable
    notes: Superficie UI de la plataforma; no aplicable a este repo consumidor.
  - id: PCT-83
    title: >-
      /projectctl?tab=doc renderiza el panel Doc listando las 5 secciones MUST +
      contrato criteria[] inline + prefix discipline + SoT única + eliminación
      de los archivos quality-plan.md y quality-status.md (legacy per
      TST-03/TST-12).
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: not-applicable
    notes: >-
      Este bundle declara las 5 secciones MUST y el contrato criteria[]; la
      superficie legacy quality-*.md se elimina (REQ-DOC-004). Validado por
      projectctl-bundle.test.ts (fase 3).
  - id: PCT-84
    title: >-
      Cada bundle de docs/app-map declara las 5 secciones canónicas MUST: URL,
      Tab, Objetivo, Criterios de calidad y Diagrama Mermaid, con sibling
      `${bundle}.mmd`.
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: not-applicable
    notes: >-
      Este index.md declara las 5 secciones MUST y su sibling index.mmd
      (Mermaid). Validado por projectctl-bundle.test.ts.
  - id: PCT-85
    title: >-
      El frontmatter criteria[] usa la estructura {id, title, functional,
      coverage} con IDs prefijados por bundle (PCT-* para views/projectctl/) y
      métodos/estados del contrato (Unit|PW-CLI|PW-AUTO|Manual ×
      covered|partial|missing|not-applicable).
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: not-applicable
    notes: >-
      Frontmatter criteria[] de este bundle sigue el contrato de
      patchBundleCoverage (backend/src/coverage-writer.ts). Validado por
      projectctl-bundle.test.ts.
  - id: PCT-86
    title: >-
      Única SoT de documentación funcional = docs/app-map/ + navigation.yaml +
      ${bundle}.md + ${bundle}.mmd; la superficie docs/01-product/quality/**
      (quality-plan.md, quality-status.md) está eliminada y no se restaura.
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: not-applicable
    notes: >-
      navigation.yaml registra la vista; quality-*.md eliminadas (REQ-DOC-004).
      Validado por projectctl-bundle.test.ts (ausencia de quality-*.md).
  - id: PCT-87
    title: >-
      El estándar projectctl-requirements (references/standard.md) es la policy
      integrada sobre cuándo y cómo actualizar bundles de docs/app-map/.
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: not-applicable
    notes: >-
      Este bundle referencia
      .agents/skills/projectctl-requirements/references/standard.md como policy
      de origen.
  - id: PCT-88
    title: >-
      Prefix discipline: IDs reservados
      PCT-*|PRJ-*|TST-*|AC-*|DSH-*|TNL-*|LGN-*|MDL-*; no se inventa prefijo
      nuevo para views/projectctl (PCT-*).
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: not-applicable
    notes: >-
      Todos los criterios de este bundle usan prefijo PCT-*; no hay prefijo
      inventado. Regla pineseada en estas notas (REQ-DOC-005).
  - id: PCT-89
    title: >-
      Existe script de tests unificado invocable vía Bun
      (scripts/test-runner.ts) con contrato 1:1 con projectctl test *.
    functional: not-applicable
    coverage:
      Unit: not-applicable
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: not-applicable
    notes: >-
      No aplicable a este repo consumidor: el panel/tab Test de /projectctl es
      superficie UI de la plataforma mis-proyectos
      (frontend/src/views/projectctl/); este repo consume el estándar sin
      implementar ese panel. El test-tab propio del repo se cubre en
      project-workspace (PWT-*) y el runner/gate en PCT-91/92/93/94.
  - id: PCT-90
    title: >-
      Contrato AC mandatorio: // @ac <ID> en primeras 10 líneas de
      .test.ts/.spec.ts + annotations Playwright; rechazo de cobertura sin AC
      mapeado.
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: not-applicable
    notes: >-
      Entregado por AC-003. El runner assertAcHeader/assertAcHeaderSpec rechaza
      archivos sin header (exit 2).
  - id: PCT-91
    title: 'projectctl test * mapea 1:1 al runner unificado scripts/test-runner.ts.'
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: covered
    notes: Entregado por AC-003. Manual vía CLI projectctl test (coordinator-owned).
  - id: PCT-92
    title: >-
      Persistencia canónica de corridas en
      .runtime/test-results/<projectId>/<run-id>/{unit,pwauto}/{junit.xml,results.json,summary.json}
      con write-back de coverage vía patchBundleCoverage.
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: not-applicable
    notes: >-
      Persistencia completada por AC-003 sobre layout existente (46 runs legacy
      preservados). Write-back sobre este bundle en fase 3.
  - id: PCT-93
    title: >-
      Layout canónico de tests/specs + gate de cobertura bun run test:check
      (subcomando check del runner, convención 2 segmentos view/feature).
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: not-applicable
    notes: >-
      Entregado por AC-003/AC-005 (frontend/playwright.config.ts + test:check).
      El gate evalua cobertura de criterios functional: implemented en fase 3.
  - id: PCT-94
    title: >-
      playwright/TEST_PLAN.md mapea archivo↔criterio con tiers PW-AUTO/PW-CLI y
      solo cambia cuando nace/cambia cobertura Playwright persistente.
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: not-applicable
    notes: Entregado por AC-003 (WU-TST-1).
  - id: PCT-95
    title: >-
      El proyecto gestionado cumple las reglas de publicabilidad de
      references/entorno.md; FRONTEND_PORT obligatorio y mapeo
      "${FRONTEND_PORT}:4321".
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: covered
    notes: >-
      Entregado por AC-001 (env FRONTEND_PORT=4321 + compose canónicos). Manual
      vía projectctl env validate (coordinator-owned).
  - id: PCT-96
    title: >-
      Overlays canónicos compose.yml (prod) / compose.dev.yml (dev) con servicio
      frontend target prod/dev; docker-compose*.yml fuera del uso canónico.
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: covered
    notes: >-
      Entregado por AC-001 (AD-01). Manual vía projectctl status
      (coordinator-owned).
  - id: PCT-97
    title: >-
      projectctl env validate reporta ok y detecta missing/invalid FRONTEND_PORT
      (regresión no permitida).
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: covered
    notes: >-
      Entregado por AC-001; validado en fase 3 vía projectctl env validate
      (coordinator-owned).
  - id: PCT-98
    title: >-
      Contrato edge mis-proyectos-edge external: true con aliases por entorno
      (<app>-origin prod / test-<app>-origin dev) preservados.
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: covered
    notes: >-
      Entregado por AC-001 (AD-01, red/alias preservados de legacy sin cambio de
      valor). Validado en projectctl status.
  - id: PCT-99
    title: >-
      Sandbox NO expone docker CLI/socket; el control de runtime es exclusivo
      vía projectctl (env *, tunnel *,
      start|stop|restart|rebuild|promote|deploy|doctor).
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: covered
    notes: >-
      Entregado por AC-001/REQ-ENT-006 (skill sandbox-runtime-policy instalada).
      Validado por suite y projectctl doctor.
  - id: PCT-100
    title: >-
      El proyecto gestionado arranca, es publicable y conecta al tunnel
      compartido con el contrato de entorno del estándar.
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: covered
    notes: >-
      Entregado por AC-001 (docs entornos/architecture/tunnel); validado por
      projectctl doctor sin drifts críticos (fase 3).
  - id: PCT-106
    title: >-
      El flujo operativo de tareas es única SoT normativa del binding
      task-flow-binding v9.0.0 en references/tareas.md.
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: not-applicable
    notes: >-
      Entregado por AC-005/AC-004. Validado por
      projectctl-requirements.sot-coherence.test.ts (gate R-007) en fase 3.
  - id: PCT-107
    title: >-
      Los estados/task states usados pertenecen al status.writable del binding
      v9; sin aliases retirados (branching, pushing, ready_for_branch,
      verified).
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: not-applicable
    notes: >-
      Entregado por AC-004 (locator v9 + retiro de estados de fixtures).
      Validado por sot-coherence gate R-007 (escaneo taskReadme).
  - id: PCT-109
    title: >-
      La ejecución SDD se enruta solo a lanes del binding
      (sdd-spec/design/tasks/ apply-*/verify-*); sin aliases retirados como
      routing.
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: not-applicable
    notes: Validado por sot-coherence gate R-007 en fase 3.
  - id: PCT-110
    title: >-
      Los gates del flujo (acceptance, app_map_close, cobertura, etc.) se
      evalúan contra el binding v9 con evidencia registrada.
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: not-applicable
    notes: >-
      Gate AC-009.app_map_close en cierre evalúa este bundle
      (criteria[].coverage sincronizado). Validado en fase 3/cierre.
  - id: PCT-112
    title: >-
      La persistencia SDD usa taskReadme como índice + phase artifacts; cfg de
      mirrors/write_order conforme al binding (este overlay: mirrors: []).
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: not-applicable
    notes: Entregado por AC-004/AC-005; validado por sot-coherence gate R-007.
  - id: PCT-121
    title: >-
      El cierre y archive de una tarea registra lineage y evidencia conforme al
      binding task-flow-binding v9.0.0.
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: not-applicable
      PW-AUTO: not-applicable
      Manual: not-applicable
    notes: >-
      Proceso de cierre del binding; validado por sot-coherence gate R-007.
      (Criterios tareas restantes PCT-108/111/113..120 según corresponda se
      trazan contra el bloque task-flow-binding citado.)
---

# Projectctl

## 1. URL

- Ruta canónica: `/projectctl`
- Tabs internas del estándar: `/projectctl?tab=cli` (default), `/projectctl?tab=doc`, `/projectctl?tab=test`, `/projectctl?tab=entorno`, `/projectctl?tab=tareas`.

## 2. Tab

Vista top-level `/projectctl` de compatibilidad con el estándar `projectctl-requirements`
(`cli | doc | test | entorno | tareas`). Este bundle documenta la **vista** y el **contrato
documental declarativo** que un proyecto debe cumplir para que su `docs/app-map/` se renderice
bien (read-only) desde la tab Doc del workspace `/project/<id>?tab=doc`.

- **doc**: reglas documentales de `docs/app-map/` (5 secciones MUST, contrato `criteria[]`
  inline, prefix discipline, SoT única, eliminación de superficie legacy quality/*).
- **test**: sistema de testing canónico (`scripts/test-runner.ts`, gate `bun run test:check`,
  `playwright/TEST_PLAN.md`, persistencia y write-back `patchBundleCoverage`).
- **entorno**: overlays canónicos `compose.yml`/`compose.dev.yml`, `FRONTEND_PORT` obligatorio,
  contrato edge, runtime exclusivo vía `projectctl`.
- **tareas**: flujo operativo SDD; única SoT normativa = bloque `task-flow-binding` v9.0.0 en
  `.agents/skills/projectctl-requirements/references/tareas.md`.
- **cli**: superficie UI de la plataforma `mis-proyectos` (no de este repo consumidor).

## 3. Objetivo

Proveer el bundle declarativo de la vista `/projectctl` y de las reglas documentales que un
proyecto debe cumplir para ser compatible con el estándar `projectctl-requirements`. Declara
las 5 secciones canónicas MUST (`URL`, `Tab`, `Objetivo`, `Criterios de calidad`, `Diagrama
Mermaid`) y el frontmatter `criteria[]` con IDs prefijados `PCT-*` para trazabilidad
doc <-> tests <-> producto (PCT-85/88), citando `.agents/skills/projectctl-requirements/
references/standard.md` como policy integrada de actualización de bundles (PCT-87).

## 4. Criterios de calidad

Criterios del estándar `projectctl-requirements` aplicables a este repo, declarados en el
frontmatter `criteria[]` (estructura `{id, title, functional, coverage}`; métodos
`Unit | PW-CLI | PW-AUTO | Manual` × estados `covered | partial | missing | not-applicable`).

| ID | Criterio | Functional | Unit | Manual |
| --- | --- | --- | --- | --- |
| PCT-79..82 (cli) | Superficie UI de catálogo CLI de la plataforma (no aplicable a este repo) | not-applicable | not-applicable | not-applicable |
| PCT-83 | Tab Doc: 5 secciones MUST + criteria[] + prefix + SoT única + eliminación quality | implemented | covered | — |
| PCT-84 | 5 secciones canónicas MUST por bundle + sibling `.mmd` | implemented | covered | — |
| PCT-85 | Contrato `criteria[]` `{id,title,functional,coverage}` con IDs `PCT-*` | implemented | covered | — |
| PCT-86 | Única SoT `docs/app-map/`+`navigation.yaml`+`${bundle}.md`+`.mmd`; quality legacy eliminada | implemented | covered | — |
| PCT-87 | `references/standard.md` como policy integrada de bundles | implemented | covered | — |
| PCT-88 | Prefix discipline PCT-*; sin prefijo inventado | implemented | covered | — |
| PCT-89 (test) | Tab Test de /projectctl — superficie UI de la plataforma `mis-proyectos`; no aplicable a este repo consumidor | not-applicable | not-applicable | not-applicable |
| PCT-90..94 (test) | Sistema de testing canónico (runner, @ac, persistencia, layout, TEST_PLAN); Unit: `endpoints.test.ts` (PCT-90/93) + `test-runner-contract.test.ts` (PCT-91/92/94) | implemented | covered | covered (PCT-91) |
| PCT-95..100 (entorno) | Overlays/env/runtime/tunnel/edge canónicos + sandbox sin docker | implemented | covered | covered |
| PCT-106..121 (tareas) | Binding task-flow v9.0.0; estados/lanes/gates/persistencia/cierre | implemented | covered | — |

> Detalle full por criterio (title + coverage por método + notes) en el frontmatter
> `criteria[]` de este archivo. La cobertura se escribe directo en `criteria[].coverage`
> (write-back `patchBundleCoverage` en fase 3); NO se usa superficie paralela.

### Prefix discipline (PCT-88)

IDs reservados por bundle/prefix: `PCT-*` (`views/projectctl/`), `PRJ-*`
(`views/project-workspace/`), `TST-*` (test-system), `AC-*` (cross-cutting), `DSH-*`
(`views/dashboard/`), `TNL-*` (tunnel), `LGN-*` (`views/login/`), `MDL-*` (`views/models/`).
Está **prohibido inventar un prefijo nuevo** para esta vista: todo criterio de
`views/projectctl/` usa `PCT-*` (REQ-DOC-005). Cualquier desviación exige spec delta +
decisión explícita en `sdd-spec`. AC cross-cutting vigentes se referencian como `AC-*` sin
reasignar IDs (p.ej. `AC-006`, `AC-009`, `AC-010`, `AC-011..AC-024`).

## 5. Diagrama Mermaid

```mermaid
flowchart TD
  pctl["/projectctl"] --> cli[Tab cli<br/>catálogo CLI (plataforma)]
  pctl --> doc[Tab doc<br/>reglas documentales]
  pctl --> test[Tab test<br/>sistema de testing]
  pctl --> entorno[Tab entorno<br/>runtime/overlays]
  pctl --> tareas[Tab tareas<br/>binding task-flow]
  doc --> standard["projectctl-requirements<br/>references/standard.md"]
  doc --> criteria["criteria[] PCT-*<br/>{id,title,functional,coverage}"]
  criteria --> coverage["patchBundleCoverage<br/>write-back fase 3"]
  test --> runner["scripts/test-runner.ts<br/>run/check"]
  runner --> persist["patchBundleCoverage<br/>.runtime/test-results"]
  entorno --> compose["compose.yml / compose.dev.yml<br/>frontend target prod/dev"]
  tareas --> binding["task-flow-binding v9.0.0<br/>references/tareas.md"]
```

> Diagrama canónico Mermaid también disponible como sibling `${bundle}.mmd`
> (`index.mmd`) acorde al contrato "bundle exacto por nodo" (standard §1). Los diagramas
> funcionales de `/projectctl` viven junto al bundle (`docs/app-map/views/projectctl/**/*.mmd`).

---

**criteria_covered**: PCT-79..PCT-88, PCT-89..PCT-94, PCT-95..PCT-100, PCT-106..PCT-121
**SoT**: `docs/app-map/` + `docs/app-map/navigation.yaml` + `index.md` + `index.mmd`
**Policy de origen**: `.agents/skills/projectctl-requirements/references/standard.md`
