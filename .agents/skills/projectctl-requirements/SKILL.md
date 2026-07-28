---
name: projectctl-requirements
description: "Trigger: projectctl rules, project onboarding, requirements checklist, docs governance, testing policy, runtime policy, task flow, projectctl operation. Cross-repo portable standard for `/projectctl` compatibility (cli | doc | test | entorno | tareas)."
metadata:
  id: projectctl-requirements
  version: 9.0.0
  layer: repo
  type: standard
  sot_policy: canonical-standard
  install: copy-tree-no-mods
  binding_id: projectctl-requirements.task-flow
  binding_role: tasks-binding
  license: MIT
---

# projectctl-requirements

Estándar cross-repo instalable y **canónico para compatibilidad `/projectctl`** (`cli | doc | test | entorno | tareas`). Centraliza los checklists y las reglas operativas mínimas que antes vivían repartidas en `docs-governance`, `testing-policy`, `ops-runtime-policy` y `projectctl-operator`, manteniendo citas a fuentes de código/docs como contexto/evidencia en formato `<aside data-skill-sot>`.

## Purpose

Esta skill existe para responder la pregunta *"¿qué reglas debe cumplir y cómo debe operar un proyecto nuevo para ser compatible con `/projectctl`?"* sin mantener checklists ni policies básicas dispersas en skills separadas. Es el **estándar canónico de compatibilidad `/projectctl`** y, como tal, su justificación per `skill-creator` §"Regla principal" cabe en una sola oración:

> Estándar cross-repo instalable y canónico de compatibilidad `/projectctl` (`cli | doc | test | entorno | tareas`), con requisitos, reglas documentales, reglas de testing, runtime gestionado, flujo de tareas y operación segura del CLI en un solo paquete.

**Lo que incluye**:

- Requisitos de las 5 tabs `cli | doc | test | entorno | tareas`.
- Reglas documentales antes cubiertas por `docs-governance`.
- Reglas de validación/evidencia antes cubiertas por `testing-policy`.
- Reglas de runtime/compose/env antes cubiertas por `ops-runtime-policy`.
- Reglas de operación segura del CLI antes cubiertas por `projectctl-operator`.

**Lo que NO es**:

- No reemplaza policies ajenas a `/projectctl` cuando el cambio pertenece claramente a otra superficie (`frontend-policy`, `fsd-architecture`, `backend-api-policy`, `sandbox-runtime-policy`, `supabase-data-policy`, `coordinador`).
- No debe duplicarse en otras skills. Si otra skill necesita criterios, checklists o reglas operativas de compatibilidad `/projectctl`, debe enlazar esta skill en vez de copiar contenido.
- No es un catálogo del CLI. El catálogo de los 71 comandos visibles vive en `frontend/src/views/projectctl/data/projectctl-commands.ts` (SoT) + `sandbox/src/lib/projectctl-registry.ts` (SoT backend). Esta skill solo agrega el **índice de reglas que un proyecto debe cumplir** para que ese CLI se renderice en `/projectctl`.

## When to use

- Cargar al trabajar con `/projectctl` (UI top-level) o con la tab Doc/Test/Entorno del workspace `/project/[id]` que necesiten entender reglas documentales, de testing o de runtime del repo.
- Cargar al crear un **proyecto nuevo** que deba ser `/projectctl`-compatible: el índice lista las reglas que el proyecto debe cumplir (sin duplicar la policy que las define).
- Cargar al hacer onboarding de un agente o humano nuevo en el repo: `SKILL.md` es el entry point navegable.
- Cargar al regenerar el bundle documental de una tab (CLI/Doc/Test/Entorno/Tareas): la skill cita las SoT a actualizar y el contrato anti-drift (ver Maintenance contract).
- Cargar cuando haya que decidir si actualizar `docs/app-map/**`, qué evidencia ejecutar (`Unit | PW-CLI | PW-AUTO | Manual`), cómo operar `projectctl`, o cómo validar compose/env para publicabilidad.

## When NOT to use

- **NO** usar para generar código de UI: las componentes SolidJS viven en `frontend/src/views/projectctl/ui/` y se gobiernan por `frontend-policy` + `fsd-architecture`.
- **NO** usar como documentation editorial general: las decisiones D-1..D-20 que rigen esta skill viven en [`references/decisions.md`](references/decisions.md) (binding canónico del paquete). El lineage extendido permanece como contexto histórico, no como fuente normativa.

## Sections (resumen de las 5 áreas)

Esta skill cubre las 5 tabs internas de `/projectctl` que un proyecto nuevo debe entender para ser compatible. Cada tab tiene su archivo `references/<tab>.md` con requisitos testeables, trazabilidad y `last-verified: YYYY-MM-DD`:

| Tab | URL | Qué cubre | Archivo de detalle |
|---|---|---|---|
| **cli** | `/projectctl?tab=cli` (default) | Catálogo de los 71 comandos visibles, agrupados por familia, con copia al portapapeles y filtro `name`. Cubre PCT-01..PCT-78 (catálogo preservado) + PCT-79..82 (UI tab nueva). | [`references/cli.md`](references/cli.md) |
| **doc** | `/projectctl?tab=doc` | Reglas documentales que un proyecto debe cumplir para que su `docs/app-map/` se renderice bien. 5 secciones MUST por bundle, contrato `criteria[]` inline, prefix discipline, SoT única, eliminación de archivos legacy. Cubre PCT-83..88. | [`references/doc.md`](references/doc.md) |
| **test** | `/projectctl?tab=test` | Reglas del sistema de testing: AC mandatorio (`// @ac <ID>`), runner unificado, persistencia atómica + write-back via `patchBundleCoverage`, gate `bun run test:check`, layout canónico. Cubre PCT-89..94. | `references/test.md` (scope de WU-SKILL-2) |
| **entorno** | `/projectctl?tab=entorno` | Reglas para que un proyecto gestionado arranque, sea publicable y conecte al tunnel compartido: overlays canónicos, `FRONTEND_PORT` obligatorio, contrato edge `mis-proyectos-edge`, sandbox sin Docker. Cubre PCT-95..100. | `references/entorno.md` (scope de WU-SKILL-2) |
| **tareas** | `/projectctl?tab=tareas` | Guía informativa de creación, cuatro fases, estados, agentes, gates, errores y entrega; el binding ejecutable vive en `references/tareas.md` (v8.0.0) y es la única SoT normativa. Cubre PCT-106..121. | `references/tareas.md` (binding `TaskFlowBindingV1` integral, WU-04) |

## References (índice navegable)

Esta skill incluye los siguientes archivos:

- `references/cli.md` — requisitos tab CLI (PCT-79..82 + referencia cruzada PCT-08..78) — **presente** (WU-SKILL-1).
- `references/doc.md` — requisitos tab Doc (PCT-83..88) — **presente** (WU-SKILL-1).
- `references/tareas.md` — **única SoT normativa** del flujo SDD. Contiene el bloque delimitado `task-flow-binding` (`TaskFlowBindingV1`, v8.0.0) con task/naming, artifact store, safe-write, fases, states/status, controls, lanes, gates, ownership, delivery, active sources y cierre. Otras referencias solo lo citan. — **presente (binding integral, WU-04)**.
- `references/standard.md` — reglas integradas de documentación, testing, runtime y operación `projectctl` antes cubiertas por skills separadas; **citan** el binding y NO redefinen machine values — **presente (v8.0.0)**.
- `references/sources.md` — tabla SoT completa por requisito, machine-grepeable (gate `sot-coherence.test.ts`); **traza** el bloque `task-flow-binding` y NO inventa machine values — **presente (v8.0.0)**.
- `references/maintenance.md` — contrato anti-drift detallado (last-verified, R-006, R-007, semver cross-repo y safeguards de taskReadme); **traza** el bloque y NO inventa machine values — **presente (v8.0.0)**.
- `references/decisions.md` — decisiones binding D-1..D-20 y D'1..D'10 que rigen la skill; confirma `TaskFlowBindingV1` como la única SoT normativa — **presente (binding v8.0.0)**.

> **Nota de portabilidad**: el contrato de instalación es `copy-tree-no-mods` — la carpeta completa (`SKILL.md`, `references/`, `assets/` y `generated/`) se copia tal cual a `.agents/skills/` de cualquier repo destino. NO se deben editar archivos dentro de la skill copiada sin bumpear `metadata.version` per el contrato semver de `references/maintenance.md`. Un cambio contractual del bloque `task-flow-binding` obliga a recopiar el árbol completo de la skill en los repos destino.

## Related skills

Las siguientes skills siguen siendo relacionadas porque cubren superficies que no se absorben aquí:

- **`.agents/skills/frontend-policy/SKILL.md`** — arquitectura frontend, deep-link `?tab=`, shells Astro finos, FSD rules.
- **`.agents/skills/fsd-architecture/SKILL.md`** — reglas FSD (cohesive grouping, strict boundaries, mandatory public API, relative & delegated state, minimal Astro shells).
- **`.agents/skills/skill-creator/SKILL.md`** — regla principal (1 skill = 1 oración justificable); checklist obligatorio para crear/editar skills.

## Maintenance contract (resumen; full detail en `references/maintenance.md`)

Esta skill es el estándar canónico de compatibilidad `/projectctl` y debe regenerarse ante cualquier cambio upstream. Las 5 reglas anti-drift son:

1. **Estándar canónico de compatibilidad `/projectctl`**. Otras skills NO deben copiar estos checklists ni policies integradas; cada requisito mantiene path + 1-2 líneas de resumen + enlace a la fuente original para trazabilidad.
2. **Cambio en una fuente citada invalida automáticamente las entradas que la referencian**. Si una fuente cambia (skill path / bundle path / CLI / API / test path), las entradas de esta skill que la citan deben regenerarse antes del próximo bump.
3. **Bumpear `last-verified` (YYYY-MM-DD) por entry ante cualquier cambio upstream**. Formato: `2026-07-24` (ISO date). El campo vive en cada bloque de requisito de `references/*.md`.
4. **Test unitario `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts`** — ejecuta checks explícitos y acotados sobre paths canónicos requeridos, locator/binding/projections, fuentes activas/excluidas y catálogos duplicados. No es un scanner genérico de todos los inline-code paths; cada nueva afirmación anti-drift debe añadirse al test.
6. **Binding único de tareas**. El flujo operativo completo vive en `references/tareas.md`; otras superficies solo lo referencian o generan una representación informativa, sin duplicar su catálogo.
7. **Semver cross-repo**. `metadata.version` refleja cambios contractuales; un cambio contractual del bloque `task-flow-binding` requiere reemplazar el árbol completo de la skill en repos destino (no mantener un híbrido de versiones).

## Source citation contract (por entry, machine-grepeable)

Cada requisito en `references/<tab>.md` se documenta con el siguiente formato estructurado, diseñado para que `sot-coherence.test.ts` lo pueda parsear con regex:

```markdown
## Requisito: <título corto>

> **SoT original**: `<path-1>` + `<path-2>` + `<CLI/API>` + `<test-path>`.
> **Cumple**: PCT-XX[, PCT-YY, ...].
> **last-verified**: YYYY-MM-DD (regenerar ante cualquier cambio en las SoT citadas).

<1-2 líneas de resumen que apuntan a la fuente citada; NO copia párrafos completos>
```

Si el repo destino no tiene una skill referenciada, la entry de `projectctl-requirements` para esa skill muestra un aviso "skill no encontrada en este repo; verifique localmente" en runtime del agente (no en UI, no es bloqueante).

## Instalación cross-repo

```bash
# Desde el repo fuente (mis-proyectos):
cp -r .agents/skills/projectctl-requirements/ <repo-destino>/.agents/skills/

# Sin modificar archivos dentro del árbol copiado.
# Si el repo destino ya tiene una copia con `metadata.version` anterior:
# el agente emite un aviso INFO no bloqueante al primer uso.
```

La copia contiene un paquete documental completo, no una instalación operacional autónoma. Para operar en el destino también deben existir y configurarse: `.agents/sdd-workflow.json`; registro de la skill y de las skills lógicas en `.atl/skill-registry.md`; `sd-protocol`, coordinador y agentes/runtime compatibles; integración del generator y de los tests Bun; checks explícitos para cada cita del paquete usada por el destino; y cualquier path project-specific citado por el binding. Registrar además la skill en el catálogo local aplicable. Estos son prerrequisitos del destino y no se modifican dentro del árbol copiado.

---

**Status**: estándar canónico de compatibilidad `/projectctl`, package v9.0.0, binding v8.0.0, scope `repo` (no global), `sot_policy: canonical-standard`. El bloque `task-flow-binding` (`TaskFlowBindingV1`) dentro de `references/tareas.md` es la única SoT normativa del flujo de tareas; cualquier referencia que cite machine values divergentes es drift y debe regenerarse.
**Cumple**: PCT-105 (skill portability + Maintenance contract + anti-drift + installability); PCT-106..PCT-121 (binding operativo de tareas).
