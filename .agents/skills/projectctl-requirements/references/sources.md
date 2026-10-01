---
file: references/sources.md
parent_skill: projectctl-requirements
owner: documentation maintenance
purpose: machine-grepeable SoT table for core criteria, docs, testing, structure and code traceability
sot_policy: canonical-standard
last_full_regen: 2026-09-27
generated_by: merge resolution after develop integration
---

# `.agents/skills/projectctl-requirements/references/sources.md` — Tabla de trazabilidad machine-grepeable

> **Tabla de trazabilidad del core**: criterios, docs, test, estructura y code. La trazabilidad del flujo de tareas PCT-106..PCT-121 pertenece a `projectctl-sdd/references/sources.md`. **last-verified: 2026-09-28**. Contrato portable: `.agents/skills/projectctl-requirements/scripts/<skill|project>/...` + wrapper local `<repo>/scripts/...` (proveído por el destino). Los IDs retired se conservan sin reciclar.
>
> La tabla mantiene paths en inline-code para trazabilidad. `scripts/skill/requirements-check.ts` valida las autoridades locales de criterios y ledger; las suites SDD son independientes.

> **Traza del diagnóstico acotado (2026-09-29)**: `scripts/project/app-map-inventory.ts` deriva nodos, bundles y criterios de `docs/app-map/navigation.yaml` y del frontmatter inline para `scripts/project/doctor-{docs,test,structure}.ts`. El selector `--target=<view>[:<feature>]` no cambia la autoridad ni la semántica de los checks gestionados globales. Pruebas: `scripts/__tests__/doctor-target.test.ts`.

## Frontera con el flujo de tareas

Ninguna fila de este índice define fases, lanes, gates, stores ni entrega SDD. Los IDs históricos del flujo conservan su trazabilidad y check en `projectctl-sdd/references/sources.md`.

## Cómo regenerar este archivo

Per `.agents/skills/projectctl-requirements/references/maintenance.md`:

1. Detectar el cambio upstream en una SoT (skill path / bundle path / CLI / API / test path).
2. Actualizar la entry correspondiente en los archivos `.md` bajo `references/` (`criterios/reglas`, `docs/reglas`, `test/reglas`, `estructura/reglas`, `code/reglas` y las referencias transversales de la raíz) con la nueva ruta/contrato.
3. Revisar este `.agents/skills/projectctl-requirements/references/sources.md`: si la tabla sigue consistente (mismos IDs PCT, mismas columnas), NO regenerar — solo bumpear `last-verified` de las filas afectadas; si la tabla diverge, regenerar completa (no editar cells sueltas).
4. Bumpear `last-verified` de las entries afectadas (formato `YYYY-MM-DD`) — un bump por entry, no global.
5. Bumpear `metadata.version` en `.agents/skills/projectctl-requirements/SKILL.md`: retirar paths públicos exige MAJOR; cambios aditivos compatibles MINOR; aclaraciones no contractuales PATCH (ver `references/maintenance.md`).
6. Ejecutar `bun .agents/skills/projectctl-requirements/scripts/skill/requirements-check.ts --check` y las suites de las superficies cambiadas.

> **MAP portable**: `scripts/skill/projectctl-map.ts` valida el formato y el digest
> del `MAP.md`; `requirements-check.ts` comprueba MAP, criterios y ledger sin
> importar satélites ni el manifest de capacidades de la instancia. Los
> registros de skills y los catálogos de lanes pertenecen a sus dueños.

> **Traza del maintenance-contract — shape del criterio app-map (PCT-85)**: el contrato
> `criteria[]` de `docs/app-map/**` requiere el campo **obligatorio** `type` (enum cerrado T-1, autoridad `.agents/skills/projectctl-requirements/references/standard.md` §1 con árbol T-5 y verificación por defecto; mapping type→carpeta en `.agents/skills/projectctl-requirements/references/estructura/reglas.md`)
> — shape post-rollout `{id, title, functional, coverage, type}` con `type` requerido
> (hardening R-A: cláusula T-3 opcional retirada y set faseado `TYPE_MIGRATION_PENDING_BUNDLES`
> eliminado; criterio sin `type` = hard error de `docs:lint` con
> `[app-map-contract] <file>: criterion <id> requires type`), documentado en
> `.agents/skills/projectctl-requirements/references/docs/reglas.md` PCT-85 y en
> `.agents/skills/projectctl-requirements/references/standard.md` §1 (árbol de clasificación T-5,
> verificación por defecto y contrato bidireccional R-B + "Auditoría de criterios"). La tabla SoT
> de este archivo NO contiene filas PCT-83..88 (la tabla completa de la tab Doc vive en
> `references/docs/reglas.md`); las filas PCT-89..105 de esta tabla no citan el shape del criterio y sus
> `last-verified` siguen lo pineado por `sot-coherence`; las filas PCT-106..121 se mantienen únicamente en `projectctl-sdd/references/sources.md`. La canonicalidad del frontmatter la garantiza el normalizador portable
> `.agents/skills/projectctl-requirements/scripts/project/app-map-format.ts` (normalizador portable;
> wrapper local `<repo>/scripts/...` proveído por el destino, suite portable
> `scripts/__tests__/app-map-format.portable.test.ts`;
> PASO 3, pineado por `sot-coherence`). Este archivo traza el cambio sin redefinir sus machine values. **last-verified: 2026-09-28**
> (regenerar ante cualquier cambio en el shape del criterio o en `standard.md` §1).

## Cómo lo lee `.agents/skills/projectctl-requirements/scripts/__tests__/projectctl-requirements.sot-coherence.test.ts`

La suite del core enumera sus paths canónicos y valida criterios y evidencia sin locator ni binding SDD. La suite independiente de `projectctl-sdd` verifica locator, binding y proyecciones cuando ese satélite está instalado.

Cada garantía nueva debe aparecer como una aserción dedicada; no hay promesa de cobertura exhaustiva sobre todos los backticks.

---

## Tabla SoT por criterio (PCT-89..PCT-94 + cross-tab/skill)

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
| `PCT-89` | Panel Test existe y lista reglas del sistema de testing | `.agents/skills/projectctl-requirements/references/test/reglas.md` + `.agents/skills/projectctl-requirements/references/standard.md` §2 | patrón portable `docs/app-map/views/<view>/` (instancia destino, no portable) | Contrato portable: `.agents/skills/projectctl-requirements/scripts/project/test-runner-contract.ts` (SoT CLI portable) + wrapper local `<repo>/scripts/...` (proveído por el destino, runtime de la instancia) | Contrato portable: `.agents/skills/projectctl-requirements/scripts/__tests__/projectctl-requirements.sot-coherence.test.ts` | `2026-09-28` |
| `PCT-90` | Contrato AC mandatorio (`// @ac` + `test.info().annotations.push`) | `.agents/skills/projectctl-requirements/references/test/reglas.md` + `.agents/skills/projectctl-requirements/references/standard.md` §2 | patrón portable `docs/app-map/views/<view>/` (instancia destino, no portable) | Contrato portable: `.agents/skills/projectctl-requirements/scripts/project/test-runner-contract.ts` (SoT CLI portable) + wrapper local `<repo>/scripts/...` (proveído por el destino, runtime de la instancia) | Contrato portable: `.agents/skills/projectctl-requirements/scripts/__tests__/projectctl-requirements.sot-coherence.test.ts` | `2026-09-28` |
| `PCT-91` | Runner unificado + mapping 1:1 con `projectctl test *` (PCT-75..78) | `.agents/skills/projectctl-requirements/references/test/reglas.md` + `.agents/skills/projectctl-requirements/references/standard.md` §2/§4 | bundle de la instancia destino (instancia origen: `docs/app-map/views/projectctl/index.md`, no portable) | Contrato portable: `.agents/skills/projectctl-requirements/scripts/project/test-runner-contract.ts` (SoT CLI portable) + wrapper local `<repo>/scripts/...` (proveído por el destino, runtime de la instancia) | Contrato portable: `.agents/skills/projectctl-requirements/scripts/__tests__/projectctl-requirements.sot-coherence.test.ts` | `2026-09-28` |
| `PCT-92` | Persistencia `.runtime/test-results/<projectId>/<run-id>/`; write-back V2 aceptado solo tras patch y >0 tests; fallback V1 pending | `.agents/skills/projectctl-requirements/references/test/reglas.md` + `.agents/skills/projectctl-requirements/references/standard.md` §2 | patrón portable `docs/app-map/views/<view>/` (instancia destino, no portable) | Contrato portable: `.agents/skills/projectctl-requirements/scripts/project/test-runner-contract.ts` (fallback portable) + wrapper local `<repo>/scripts/...` (proveído por el destino, writer de la instancia) + `.agents/skills/projectctl-requirements/scripts/project/doctor-test.ts` (diagnóstico del proyecto) | `.agents/skills/projectctl-requirements/scripts/__tests__/projectctl-requirements.sot-coherence.test.ts` | `2026-09-28` |
| `PCT-93` | Gate `bun run test:check` (TST-13) + layout/discovery canónicos (TST-36) | `.agents/skills/projectctl-requirements/references/test/reglas.md` + `.agents/skills/projectctl-requirements/references/standard.md` §2 | patrón portable `docs/app-map/views/<view>/` (instancia destino, no portable) | Contrato portable: `.agents/skills/projectctl-requirements/scripts/project/test-runner-contract.ts` (SoT CLI portable) + wrapper local `<repo>/scripts/...` (proveído por el destino, runtime de la instancia) | Contrato portable: `.agents/skills/projectctl-requirements/scripts/__tests__/projectctl-requirements.sot-coherence.test.ts` | `2026-09-28` |
| `PCT-94` | References: `playwright/TEST_PLAN.md` mapping + integrated testing policy | `.agents/skills/projectctl-requirements/references/test/reglas.md` + `.agents/skills/projectctl-requirements/references/standard.md` §2 | patrón portable `docs/app-map/views/<view>/` (instancia destino, no portable) | Contrato portable: `.agents/skills/projectctl-requirements/scripts/project/test-runner-contract.ts` (SoT CLI portable) + `playwright/TEST_PLAN.md` (proveído por el destino) | Contrato portable: `.agents/skills/projectctl-requirements/scripts/__tests__/projectctl-requirements.sot-coherence.test.ts` | `2026-09-28` |

### Anexo descubrimiento gestionado (TST-39..TST-42)

| TST ID | Requisito | SoT skill path | SoT bundle path | SoT CLI/API/Runtime | SoT test path | last-verified |
| --- | --- | --- | --- | --- | --- | --- |
| `TST-39` | Copia única `@playwright/test` (el proyecto no la declara; resuelve a plataforma) | `.agents/skills/projectctl-requirements/references/test/reglas.md` + `.agents/skills/projectctl-requirements/references/standard.md` §2 | patrón portable `docs/app-map/views/<view>/` (instancia destino, no portable) | `.agents/skills/projectctl-requirements/scripts/project/doctor-test.ts` (`TST-39-SINGLE-COPY`) + wrapper local `<repo>/scripts/...` (proveído por el destino, runtime de la instancia) | `projectctl test run --method=pwauto --target=<view>` (run gestionado) | `2026-09-28` |
| `TST-40` | Owner `// @<view>` en las primeras 10 líneas de cada spec | `.agents/skills/projectctl-requirements/references/test/reglas.md` + `.agents/skills/projectctl-requirements/references/standard.md` §2 | `docs/app-map/navigation.yaml` (IDs de views) | `.agents/skills/projectctl-requirements/scripts/project/test-runner-contract.ts` (`validateOwnerAnnotation`) + `.agents/skills/projectctl-requirements/scripts/project/doctor-test.ts` (`TST-40-OWNER`) | `projectctl test run --method=pwauto --target=<view>` (specInventory sin gaps) | `2026-09-28` |
| `TST-41` | Ubicaciones acotadas `tests/e2e/<view>/` y `tests/unit/<view>/` | `.agents/skills/projectctl-requirements/references/test/reglas.md` + `.agents/skills/projectctl-requirements/references/standard.md` §2 | `docs/app-map/navigation.yaml` (IDs de views) | Contrato portable: `.agents/skills/projectctl-requirements/scripts/project/doctor-test.ts` (`TST-41-BOUNDED-LOCATION`) + wrapper local `<repo>/scripts/...` (proveído por el destino, `discoveryRoots` de la instancia) | `projectctl test run --method=all --target=<view>` (resolvedFiles + specInventory) | `2026-09-28` |
| `TST-42` | Títulos `test('...')` con ID trazado al header `// @ac` | `.agents/skills/projectctl-requirements/references/test/reglas.md` + `.agents/skills/projectctl-requirements/references/standard.md` §2 | patrón portable `docs/app-map/views/<view>/` (instancia destino, no portable) | `.agents/skills/projectctl-requirements/scripts/project/test-runner-contract.ts` (`validateSpecTitleIds`) + `.agents/skills/projectctl-requirements/scripts/project/doctor-test.ts` (`TST-42-SPEC-TITLE`) | `projectctl test run --method=pwauto --target=<view>` (filtro `--grep` ejecuta) | `2026-09-28` |

### Entorno (PCT-95..PCT-100)

La trazabilidad de esos IDs pertenece a [`projectcl-enviorement/references/sources.md`](../../projectcl-enviorement/references/sources.md). El core no define ni diagnostica el runtime gestionado.

### Cross-tab + skill portability (PCT-101..PCT-105 — extracto; tabla completa en `.agents/skills/projectctl-requirements/references/maintenance.md` y en los archivos `.md` de `references/` para `cli` y `doc` por WU-SKILL-1)

| PCT ID | Requisito | SoT skill path | SoT bundle path | SoT CLI/API/Runtime | SoT test path | last-verified |
| --- | --- | --- | --- | --- | --- | --- |
| `PCT-101` | retired — instancia origen, no portable (tabs UI de la instancia; v20.0.0) | retired | retired | retired | retired | `2026-09-27` |
| `PCT-102` | retired — instancia origen, no portable (aside sources UI de la instancia; v20.0.0) | retired | retired | retired | retired | `2026-09-27` |
| `PCT-103` | retired — instancia origen, no portable (bundle raíz de la instancia; v20.0.0) | retired | retired | retired | retired | `2026-09-27` |
| `PCT-104` | retired — instancia origen, no portable (`data-testid` UI de la instancia; v20.0.0) | retired | retired | retired | retired | `2026-09-27` |
| `PCT-105` | Paquete core copiable sin SDD + mantenimiento y prerequisitos explícitos | `.agents/skills/projectctl-requirements/SKILL.md` + `.agents/skills/projectctl-requirements/scripts/skill/requirements-check.ts` | docs de la instancia destino (no portable) | n/a (filesystem-only) | `.agents/skills/projectctl-requirements/scripts/__tests__/core-only-check.test.ts` | `2026-09-27` |

### Tareas opcionales (PCT-106..PCT-121)

La autoridad y trazabilidad de estos IDs pertenecen a `projectctl-sdd/references/sources.md`. El core solo ofrece la tab informativa cuando el satélite está instalado; los criterios, la documentación y la evidencia siguen funcionando sin ella.

### Criterios nuevos 2026-09-07 — backfill + reglas (PCT-149..154, TST-38, AC-329)

La trazabilidad de `PCT-155` (proposal SDD) está en `projectctl-sdd/references/sources.md`.

> Filas del backfill de 21 criterios (G-8, born-typed con el shape post-rollout
> `{id, title, functional, coverage, type}`) y de las reglas R-B/R-C. El catálogo completo de
> cada criterio vive en su bundle (principio anti-duplicación: esta tabla cita paths, NO
> reproduce catálogos). Los 8 IDs de esta sección son los del scope `/projectctl` + tab
> Test de esta tabla; los demás criterios nuevos del backfill (`PRJ-100..107`,
> `TNL-30..32`, `MDL-63`) viven en bundles de otras vistas (`project-workspace`,
> `tunnel-management`, `models`) fuera del alcance `/projectctl` de esta tabla — su SoT es su
> bundle. El corpus y sus títulos se verifican por la instancia en
> `integration-tests/projectctl/app-map-criteria-types.test.ts`, no por el core.

| ID | Requisito | SoT skill path | SoT bundle path | SoT CLI/API/Runtime | SoT test path | last-verified |
| --- | --- | --- | --- | --- | --- | --- |
| `PCT-149` | retired — instancia origen, no portable (regla spawn sandbox de la instancia; v20.0.0) | retired | retired | retired | retired | `2026-09-27` |
| `PCT-150` | retired — instancia origen, no portable (ruta API de la instancia; v20.0.0) | retired | retired | retired | retired | `2026-09-27` |
| `PCT-151` | retired — instancia origen, no portable (familia API de la instancia; v20.0.0) | retired | retired | retired | retired | `2026-09-27` |
| `PCT-153` | retired — instancia origen, no portable (webhook de la instancia; v20.0.0) | retired | retired | retired | retired | `2026-09-27` |
| `PCT-154` | Contrato bidireccional código⇒criterio con procedimiento de auditoría en close | `.agents/skills/projectctl-requirements/references/standard.md` §1 + `.agents/skills/projectctl-requirements/references/docs/reglas.md` (PCT-85) | bundle de la instancia destino (instancia origen: `docs/app-map/views/projectctl/features/doc.md`, no portable) | Contrato portable: `.agents/skills/projectctl-requirements/scripts/project/docs-lint-core.ts` (checks 1-5 puros) + wrapper local `<repo>/scripts/...` (proveído por el destino) | wrapper local `<repo>/scripts/...` (proveído por el destino, evidencia de la instancia) | `2026-09-28` |
| `TST-38` | `docs-lint` valida trazabilidad código⇒criterio contra SoT `docs/app-map` (checks 1-5) | `.agents/skills/projectctl-requirements/references/test/reglas.md` (TST-38) + `.agents/skills/projectctl-requirements/references/standard.md` §1/§2 | patrón portable `docs/app-map/views/<view>/` (instancia destino, no portable) | Contrato portable: `.agents/skills/projectctl-requirements/scripts/project/docs-lint-core.ts` (checks 1-5 puros) + wrapper local `<repo>/scripts/...` (proveído por el destino) | wrapper local `<repo>/scripts/...` (proveído por el destino, evidencia de la instancia) | `2026-09-28` |
| `AC-329` | La auditoría doc⇒código verifica que cada criterio declarado tiene evidencia o justificación | `.agents/skills/projectctl-requirements/references/standard.md` §1 | patrón portable `docs/app-map/views/<view>/` (instancia destino, no portable) | Contrato portable: `.agents/skills/projectctl-requirements/scripts/project/docs-lint-core.ts` (checks 1-5 puros) + wrapper local `<repo>/scripts/...` (proveído por el destino) | wrapper local `<repo>/scripts/...` (proveído por el destino, evidencia de la instancia) | `2026-09-27` |

---

### Apartado de criterios (PCT-169..PCT-174)

| ID | Requisito | SoT skill path | SoT bundle path | SoT CLI/API/Runtime | SoT test path | last-verified |
| --- | --- | --- | --- | --- | --- | --- |
| `PCT-169` | retired — instancia origen, no portable (routing de la instancia; v20.0.0) | retired | retired | retired | retired | `2026-09-27` |
| `PCT-170` | Autoridad inline y referencia derivada cita-no-copia | `.agents/skills/projectctl-requirements/references/criterios/reglas.md` (índice derivado) | bundle de la instancia destino (no portable) | n/a | `.agents/skills/projectctl-requirements/scripts/__tests__/projectctl-requirements.sot-coherence.test.ts` (contrato core) + `integration-tests/projectctl/bundle-contracts.test.ts` (instancia) | `2026-09-28` |
| `PCT-171` | Enum vigente de 9 (T-1); 7 valores PCT como alias históricos con mapping preservado | `.agents/skills/projectctl-requirements/references/criterios/reglas.md` (índice derivado) + `.agents/skills/projectctl-requirements/references/estructura/reglas.md` | bundle de la instancia destino (no portable) | n/a | `.agents/skills/projectctl-requirements/scripts/__tests__/projectctl-criteria-integrity.test.ts` (contrato core) + `integration-tests/projectctl/bundle-contracts.test.ts` (instancia) | `2026-09-28` |
| `PCT-172` | Ledger de coverage separado de la autoridad `criteria[]` | `.agents/skills/projectctl-requirements/references/criterios/reglas.md` (índice derivado) + `.agents/skills/projectctl-requirements/references/standard.md` §2 | bundle de la instancia destino (no portable) | n/a | `.agents/skills/projectctl-requirements/scripts/__tests__/projectctl-criteria-integrity.test.ts` (contrato core) + `integration-tests/projectctl/bundle-contracts.test.ts` (instancia) | `2026-09-28` |
| `PCT-173` | retired — instancia origen, no portable (sources UI de la instancia; v20.0.0) | retired | retired | retired | retired | `2026-09-27` |
| `PCT-174` | retired — instancia origen, no portable (generador de la instancia; v20.0.0) | retired | retired | retired | retired | `2026-09-27` |
| `PCT-175` | `projectctl criteria check` valida calidad semántica MVP y preserva autoridad inline/cita-no-copia | `.agents/skills/projectctl-requirements/SKILL.md` + `.agents/skills/projectctl-requirements/references/criterios/reglas.md` | bundle de la instancia destino (no portable) | Contrato portable: `projectctl criteria check` + `.agents/skills/projectctl-requirements/scripts/skill/projectctl-criteria-integrity.ts` | wrapper local `<repo>/scripts/...` (proveído por el destino, evidencia de la instancia) | `2026-09-28` |
| `PCT-176` | retired — instancia origen, no portable (catálogo registry de la instancia; v20.0.0) | retired | retired | retired | retired | `2026-09-27` |

---

## Reglas machine-grepeable (para validación automatizada)

Los paths, comandos CLI (`projectctl ...`) y rutas API (`/api/...`) van entre backticks en formato legible; el contrato machine solo existe donde un test lo pinnee explícitamente (`sot-coherence` tiene checks acotados, no scanner genérico).

## Criterios cubiertos por este archivo

`PCT-89..PCT-121` + criterios nuevos `PCT-149..PCT-155`, `TST-38`, `AC-329`, `PCT-175` (secciones "Criterios nuevos 2026-09-07 — backfill + reglas" y "Apartado de criterios").

(Véase `.agents/skills/projectctl-sdd/references/tasks/binding.md` v13.0.0 para el bloque integral `task-flow-binding`.)
