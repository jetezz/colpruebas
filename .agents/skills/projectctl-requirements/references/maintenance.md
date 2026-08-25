---
file: references/maintenance.md
parent_skill: projectctl-requirements
owner: WU-04 (apply-code-high)
purpose: anti-drift contract + cross-repo semver + SoT coherence + task-flow binding safeguards
sot_policy: canonical-standard
version: 10.0.0
last_full_regen: 2026-07-31
generated_by: sdd-apply-code-high (WU-PKG-01) — taskReadme/20260731-skltsk-seleccion-de-skills-por-tarea/apply-WU-PKG-01.md
binding_role: traces_task_flow_binding_block_only
---

# `.agents/skills/projectctl-requirements/references/maintenance.md` — Contrato anti-drift + versionado cross-repo

> **Archivo referente**: contrato operativo que rige la regeneración, verificación de coherencia y versionado cross-repo de la skill `projectctl-requirements`. Este archivo es la **forma detallada** del bloque `Maintenance contract` declarado en `.agents/skills/projectctl-requirements/SKILL.md`. Cualquier agente, humano o script que toque la skill debe leer este archivo antes de tomar decisiones de cambio.
>
> **Rol respecto al bloque `task-flow-binding`**: este archivo traza el bloque delimitado en `.agents/skills/projectctl-requirements/references/tareas.md` v9.0.0 sin redefinirlo.

## 1. Estándar canónico de compatibilidad `/projectctl`

> **SoT original**: `.agents/skills/skill-creator/SKILL.md` (regla principal: "una skill debe poder explicarse en una oración").

La skill `projectctl-requirements` es el **estándar canónico de compatibilidad `/projectctl`** del repo. Absorbe las reglas de valor de `docs-governance`, `testing-policy`, `ops-runtime-policy` y `projectctl-operator`, y mantiene el **binding integral** de flujo de tareas (bloque delimitado `task-flow-binding`, `TaskFlowBindingV1`) en `references/tareas.md` para que viajen juntos. Toda entry cita rutas de trazabilidad en formato inline-code (machine-grepeable) y se limita a:

- Listar el path original (`<skill-path>` o `<bundle-path>` o `<CLI/API/runtime>` o `<test-path>`).
- Resumir el requisito en 1-2 frases.
- Enlazar a las fuentes relacionadas para que el lector vaya al detalle operativo cuando lo necesite.
- Si una entry necesita un valor del workflow de tareas (fase, lane, gate, `artifact_store`, `delivery`, `active_sources`), citar el **identificador** dentro del bloque `task-flow-binding` (p. ej. `` `lanes["sdd-apply-code-high"]` ``, `` `gates["AC-010.passed_and_branch_available"]` ``), nunca el catálogo expandido.

Consecuencias operativas:

- **No copiar párrafos** de skills externas restantes ni de los bundles documentales.
- **Las responsabilidades absorbidas viven solo en `references/standard.md`**; otras skills no deben mantener duplicados activos de esas reglas si se decide eliminarlas.
- **Toda duplicación detectada** fuera de este estándar integrado o fuera del bloque `task-flow-binding` se considera un bug crítico de skill (`R-006` per `taskReadme §5.6`).

---

## 2. Cambio upstream invalida entries

> **SoT original**: `.agents/skills/sd-protocol/persistence-contract.md` + `.agents/skills/skill-creator/SKILL.md`.

Cualquier cambio en una **fuente citada** (skill path / bundle path / CLI / API / test path) **invalida** automáticamente las entries de la skill que la referencian. Ejemplos de cambios upstream que invalidan entries:

1. Renombre o movimiento de una fuente citada: invalida TODAS las entries que la citen.
2. Adición/eliminación de un criterio en un bundle documental (`docs/app-map/views/projectctl/index.md`): invalida las entries que citen IDs PCT que ya no existen.
3. Cambio en el contrato de un CLI (ej. `projectctl test run` ahora requiere `--project-id`): invalida entries que citen el comando con su firma anterior.
4. Cambio en el path de un test (ej. hipotético rename de `frontend/__tests__/projectctl-commands-mapping.test.ts` a `lib/projectctl/commands-mapping.test.ts`): invalida las entries de la fila `SoT test path`.
5. Eliminación de una skill externa referenciada en el repo destino: NO invalida la entry si la regla base ya vive en `references/standard.md`; solo dispara el aviso "skill no encontrada en este repo; verifique localmente" cuando la entry todavía cite esa skill como fuente externa.

Detección:

- Manual: el workflow de refresh (`gentle-ai skill-registry refresh --force`, `sdd-apply-doc` regenerando la tabla SoT, o un dev humano) corre `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` y observa fallos.
- Automática: no existe un scanner genérico en este paquete; cualquier automatización futura debe añadirse como contrato y test explícitos.

---

## 3. Bump de `last-verified` por entry ante cambio upstream

> **SoT original**: `.agents/skills/skill-creator/SKILL.md` + `.agents/skills/sd-protocol/persistence-contract.md`.

### Regla

`last-verified` es **per entry**, formato `YYYY-MM-DD`. Bumpear `last-verified` de una entry NO requiere bumpear `last-verified` de las otras entries del mismo archivo — la granularidad es fina (`R-007 mitigación` per `taskReadme §5.6`).

### Procedimiento

1. Detectar el cambio upstream (manual, vía PR review, o vía `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` fallando).
2. Para cada entry afectada:
   - Actualizar el bloque `SoT original` con el nuevo path / contrato.
   - Bumpear `last-verified` a la fecha del día.
   - Si el cambio es semántico (ej. cambia el contrato de un CLI), re-verificar que el resto de la entry sigue vigente (no requiere regenerar el archivo entero).
   - Si el cambio es cosmético (ej. rename de un path), bumpear `last-verified` solamente.
3. NO bumpear `metadata.version` en `.agents/skills/projectctl-requirements/SKILL.md` automáticamente — eso se hace per la regla §5 (Versionado cross-repo).
4. Actualizar `last_full_regen` en este archivo `.agents/skills/projectctl-requirements/references/maintenance.md` SOLO si las 5 reglas del bloque `Maintenance contract` cambian (no por entries individuales).

### Forma rápida

```bash
# Regenerar entry específica (no todo el archivo) — ejemplo para PCT-95:
# 1. Editar manualmente references/entorno.md bloque PCT-95.
# 2. Bumpear last-verified del PCT-95 de 2026-07-07 → fecha actual.
# 3. NO tocar otras entries.
# 4. NO tocar references/sources.md si la tabla sigue consistente (revisar manualmente).
# 5. Correr bun test frontend/__tests__/projectctl-requirements.sot-coherence.test.ts.
```

---

## 4. Test `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` (gate R-007)

> **SoT original**: `references/decisions.md` (binding) + lineage extendido en `taskReadme/20260707-omn2qs-completar-projectctl.md` §7.7.3 + §7.11 (contexto histórico, no fuente normativa).

### Nombre y path

`frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` (presente y ejecutable con Bun).

### Header obligatorio

```ts
// @ac AC-001
```

El header real declara los AC/SC cubiertos en las primeras líneas; el test runner valida el contrato de headers.

### Qué valida

El test implementa checks explícitos y acotados: presencia de los paths canónicos enumerados en la suite; identidad entre locator, binding y projections; `active_sources.include/exclude`; ausencia de catálogos operativos duplicados y aliases retirados; y contratos runtime/documentales añadidos expresamente. No extrae ni verifica genéricamente todos los paths inline-code de `references/*.md`. Una nueva afirmación anti-drift requiere una aserción dedicada.

### Local vs cross-repo

- En el repo fuente: el test garantiza únicamente los paths e invariantes que enumera explícitamente. Una cita no cubierta por una aserción dedicada no queda validada por este gate.
- En el repo destino: copiar el paquete no copia el test ni vuelve exhaustiva su integración. El destino debe añadir o adaptar checks explícitos para cada cita del paquete de la que dependa; solo esos checks garantizan existencia/coherencia local.

Este diseño **delega la integración al repo destino**: no hay scanner global ni suite instalada automáticamente. El checklist de instalación exige registrar las aserciones locales necesarias antes de afirmar que una cita está cubierta.

### Skip explícito paths excluidos

Las citas con URLs, paths absolutos, placeholders o globs no están sujetas a un filtro genérico porque no existe un scanner genérico. Si una debe verificarse, se añade un check explícito con semántica propia. El gate solo garantiza las aserciones visibles en el test actual; no prueba exhaustivamente toda cita documental.

---

## 5. Versionado cross-repo (resolución D-10 + R-012)

> **SoT original**: `references/decisions.md` (D-10 binding) + `taskReadme/20260707-omn2qs-completar-projectctl.md` §7.10 (lineage extendido) + `.agents/skills/skill-creator/SKILL.md` (sot_policy).

### `metadata.version` semver interno

La skill declara `metadata.version` semver en `.agents/skills/projectctl-requirements/SKILL.md` (package actual: `10.0.0`; binding machine: `9.0.0`).

### Reglas de bump

| Cambio | Bump | Justificación |
| --- | --- | --- |
| Cambio contractual en `.agents/skills/projectctl-requirements/SKILL.md` o en el binding integral de `references/tareas.md` (Purpose, Maintenance contract, estructura de frontmatter, `metadata.sot_policy`, bloque `task-flow-binding`/`TaskFlowBindingV1` — su shape, sus `task` (incl. `heading_owners`), `artifact_store`, `status`, `phases`, `controls`, `lanes`, `gates`, `modes`, `delivery`, `active_sources` o `retired_aliases` —); también la eliminación de un campo del binding o cualquier deduplicación del shape | **MAJOR** (`N.x.y` → `(N+1).0.0`) | Breaking: los repos destino deben reemplazar el árbol completo de la skill. Mezclar versiones produciría projections incompatibles. |
| Adición o modificación no-breaking de un archivo `references/` o de un campo opcional del bloque (p. ej. una nueva `lane` con `owner_phase` ya presente, un nuevo `gate.evaluator` sin cambiar los existentes) | **MINOR** | Las entradas existentes mantienen sus IDs y contrato. |
| Bumpear `last-verified` per entry o corregir texto sin cambio de contrato | **PATCH** | Cero impacto semántico. |

> **IMPORTANTE**: bumpear `last-verified` per entry NO requiere bumpear `metadata.version` (es PATCH individual; puede acumular varios PATCHes sin bump de version si la entry no cambió semánticamente). El bump de `metadata.version` se hace **al cierre** de un ciclo de cambios (manual, por el dev que cierra la PR).

> **Bump vigente v5.0.0 → v6.0.0 (MAJOR)**: cambio de shape del binding — `task.heading_owners` colapsado a 9 secciones de coordinación, `artifact_store` reestructurado con `primary.role: index` + `index_budget` y `phase_artifacts`, y `mirrors[0].role` promovido a `knowledge` (best-effort, `required: false`). Al ser un cambio breaking del `TaskFlowBindingV1`, los repos destino deben reemplazar el árbol completo. Rationale y migración: `docs/05-refactor/taskreadme-engram/` y `references/decisions.md` §D-17.

> **Bump vigente v6.3.0 → v7.0.0 (MAJOR)**: cada entrada de `lanes` declara el identificador lógico `skill`; `apply_lane` es opcional y queda limitado a `code-low | code-medium | code-high`. Esto desacopla la dirección de routing de la skill que la implementa sin publicar paths físicos. Los repos destino deben reemplazar el árbol completo.

> **Bump vigente v7.0.0 → v8.0.0 (MAJOR)**: se elimina el mirror configurado y los campos de disponibilidad asociados. El índice taskReadme y sus phase artifacts son las fuentes completas de persistencia y recovery; herramientas opcionales de soporte quedan fuera de la corrección SDD.

> **Bump vigente package v8.0.0 → v9.0.0 (MAJOR; binding permanece v8.0.0)**: corrige el contrato público de cinco tabs, portabilidad y prerequisitos externos, añade D-20 y alinea las garantías anti-drift con los checks acotados reales. `modes` ya estaba en el machine block v8; documentarlo y validarlo no cambia sus valores ni su `binding_version`.

> **Bump vigente package v9.0.0 → v10.0.0 / binding v8.0.0 → v9.0.0 (MAJOR)**: añade `/task_skill_selection` al machine block para snapshots `task-skills/v1`, resolución project-installed y orden obligatorio lane → surfaces → optional helpers; también publica el contrato profesional PCT-53/PCT-54. Los repos destino deben reemplazar el árbol completo, actualizar el pin locator y regenerar todas las proyecciones.

### Audit trail cross-repo

- **Dentro de `mis-proyectos`**: el changelog de la skill vive en **git history** (commit messages + diffs); no existe un `CHANGELOG.md` dentro del paquete.
- **Cross-repo (otros repos)**: cuando se copia la skill a un repo destino, ese repo NO tiene el git history del fuente. La entry `metadata.version` + los `last-verified` por entry son la única señal de freshness que el repo destino tiene. **Esto es intencional** — el repo destino corre `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` localmente para detectar drift por sí mismo.

### Comportamiento al primer uso en repo destino

El agente que carga `projectctl-requirements` en repo destino debe:

1. Leer `metadata.version` + `metadata.sot_policy: canonical-standard` del `.agents/skills/projectctl-requirements/SKILL.md` frontmatter.
2. Si el repo destino ya tiene `.agents/skills/projectctl-requirements/SKILL.md` con `metadata.version < <versión importada>` → mostrar un **aviso explícito no bloqueante** (nivel INFO en log del agente, NO en UI, NO en runtime browser):
   `"projectctl-requirements: local <X.Y.Z> is older than imported <X.Y.Z>. Update recommended."`
3. Si la versión destino es **igual o mayor** → carga silenciosa (sin aviso).
4. **NO** se auto-bloquea (cumplir ADDED-SKILL-005 installability additive sin romper "skill se copia y funciona").

### Detección de drift cross-repo

- `.agents/skills/projectctl-requirements/references/sources.md` declara `last-verified` por SoT entry.
- `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` (en cada repo que integre esa suite) valida sus checks acotados contra el repo actual. PCT-105 no implica un test global ni se instala fuera del árbol automáticamente.

### No-installation contract

- La skill **NO** se auto-publica ni se auto-sincroniza a otros repos. El humano decide cuándo copiarla.
- Cuando se copia, se copia el **tree completo** (`SKILL.md`, `references/`, `assets/`, `generated/`) **sin modificar nada** (ADDED-SKILL-005).
- La copia no instala sus prerrequisitos externos: locator, registro de skills, `sd-protocol`, coordinador/agentes runtime, integración generator/tests y paths específicos del proyecto destino deben existir y configurarse por separado.
- El destino debe añadir checks explícitos para toda cita del paquete que use operacionalmente; la ausencia de ese check significa que la cita no está garantizada por anti-drift.
- Si en el repo destino falta una skill referenciada, la entry de `projectctl-requirements` para esa skill muestra un **aviso `"skill no encontrada en este repo; verifique localmente"`** en runtime del agente, no en UI.

---

## 6. Reglas operativas finales

> **SoT original**: este archivo + `.agents/skills/skill-creator/SKILL.md` + `.agents/skills/coordinador/SKILL.md`.

| # | Regla | Quién la aplica |
| --- | --- | --- |
| R-MAINT-1 | Toda entry de la skill cita su SoT original en formato inline-code machine-grepeable | Autor de la entry (humano/agente) |
| R-MAINT-2 | Bumpear `last-verified` por entry ante cambio upstream | Agente o dev que detecta el cambio |
| R-MAINT-3 | Regenerar `.agents/skills/projectctl-requirements/references/sources.md` completo cuando cambia una SoT o una regla integrada de `standard.md` | Agente `sdd-apply-doc` o dev que cierra la PR |
| R-MAINT-4 | Bumpear `metadata.version` PATCH/MINOR/MAJOR al cierre del ciclo de cambios | Dev que cierra la PR |
| R-MAINT-5 | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` corre en cada repo destino localmente | Bun test (comando: `bun test` sobre el archivo `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts`) |
| R-MAINT-6 | Aviso no bloqueante al primer uso en repo destino si `metadata.version` destino < importada | Agente que carga la skill |
| R-MAINT-7 | Aviso "skill no encontrada en este repo" si una entry cita una skill inexistente en el destino | Agente que evalúa la skill |
| R-MAINT-8 | La skill NO se auto-publica; el humano decide cuándo copiarla | Humano / workflow |

---

## 7. Checklist de regeneración (R-007 mitigation, manual)

Per cambio upstream detectado:

```text
[ ] Identificar la entry o entries afectadas en references/{cli,doc,test,entorno,tareas}.md.
[ ] Identificar la entry o entries afectadas en references/sources.md (puede ser 0 si la tabla ya está consistente).
[ ] Para cada entry afectada en references/{cli,doc,test,entorno,tareas}.md:
    [ ] Actualizar el bloque SoT original con el nuevo path / contrato.
    [ ] Bumpear last-verified a la fecha del día (YYYY-MM-DD).
    [ ] Verificar que el resto de la entry sigue vigente.
[ ] Para references/sources.md:
    [ ] Si la tabla sigue consistente (mismos IDs PCT, mismas columnas), NO regenerar.
    [ ] Si la tabla diverge, regenerar completa (no editar cells sueltas).
    [ ] Bumpear last-verified de las filas afectadas.
[ ] Para references/maintenance.md (este archivo):
    [ ] Bumpear last_full_regen solo si las reglas del bloque Maintenance contract cambian.
[ ] Correr bun test frontend/__tests__/projectctl-requirements.sot-coherence.test.ts.
[ ] Confirmar que el test pasa verde.
[ ] Decidir bump de metadata.version (PATCH / MINOR / MAJOR) per §5.
[ ] Si el bump es MAJOR o MINOR, regenerar este archivo references/maintenance.md actualizando version.
```

---

## 8. Safeguards de taskReadme y fuentes

- Un reset, eliminación o renombrado de un taskReadme o phase artifact requiere confirmación del coordinador y preservación de la evidencia de estado.
- Nunca se restaura un taskReadme ausente desde una memoria stale ni se usa una memoria anterior para reservar IDs, reemplazar decisiones o reconstruir una fuente normativa.
- Cualquier cambio en el bloque `task-flow-binding` (`TaskFlowBindingV1`, v9.0.0) delimitado en `.agents/skills/projectctl-requirements/references/tareas.md` obliga a:
  1. Regenerar `.agents/skills/projectctl-requirements/generated/phase-state-schema.json` mediante `taskflow:generate` (owned by `sdd-apply-code-high-WU-11`).
  2. Revisar `.agents/skills/projectctl-requirements/references/sources.md` para asegurar que la tabla `PCT-106..PCT-121` sigue trazando el bloque (solo identificadores) sin reproducir machine values.
  3. Revisar `.agents/skills/projectctl-requirements/references/decisions.md` para mantener las decisiones D-N y D'-N alineadas con la nueva forma del binding.
  4. Bumpear `metadata.version` per §5 antes del siguiente cierre de ciclo.
  5. Bumpear `last-verified` por entry de la tabla SoT afectada.
- La copia cross-repo es de árbol completo y sin modificaciones locales; una versión anterior se reemplaza, no se mezcla. Mezclar versiones incompatibles del árbol produce projections incompatibles y se considera drift.

## 9. Criterios cubiertos por este archivo

`PCT-105` (cross-repo + anti-drift + installability), `PCT-106..PCT-121` (binding de tareas) y elementos contractuales de `PCT-83..PCT-100` referenciados desde este archivo.

(Véase `.agents/skills/projectctl-requirements/references/sources.md` para la tabla SoT machine-grepeable completa, `references/{test,entorno}.md` para los contratos operativos de cada tab y `.agents/skills/projectctl-requirements/references/tareas.md` v9.0.0 §`task-flow-binding` para el bloque integral `TaskFlowBindingV1`.)

---

## 10. Skill-registry generator format (SoT del row shape del registry)

> **SoT original**: generador canónico `gentle-ai skill-registry refresh --force` (output: `.atl/skill-registry.md`) + `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` (checks A/B de WU-CODE-5, task `20260804-drift-cleanup-projectctl`).
> **Cumple**: AC-007b (spec `20260804-drift-cleanup-projectctl`, REQ-SPEC-DRIFT-2-B).
> **last-verified**: 2026-08-04 (regenerar ante cualquier cambio en el generador o en su output).

### Decisión: el generador es la SoT del formato

El formato del row de `.atl/skill-registry.md` lo define el generador canónico `gentle-ai skill-registry refresh --force` (design AD-5 de `20260804-drift-cleanup-projectctl`). Este archivo declara ese formato como **SoT del shape**: ninguna assertion de test, contrato documental o edición manual puede divergir de lo que el generador emite. Una diferencia entre el formato documentado aquí y el output real es drift y se resuelve en el contrato correcto (regeneración o bump de versión), nunca con una excepción silenciosa.

### Formato emitido (header + row shape)

- **Header `Auto-generated`**: el archivo generado conserva el comentario `<!-- Auto-generated by gentle-ai skill-registry refresh. ... -->`. La ausencia de ese marcador invalida el archivo como salida del generador (Check B step 2a del test).
- **Tabla**: 4 columnas `| Skill | Trigger / description | Scope | Path |` con separador `| --- |` y una fila por skill emitida.
- **Row shape** — backticks discipline + path absoluto derivado de `REPO_ROOT`:

  `` | `<skill>` | <trigger/description> | project | `<REPO_ROOT>/.agents/skills/<skill>/SKILL.md` | ``

  - `<skill>` envuelto en backticks exactos (un backtick de apertura, contenido sin backticks, un backtick de cierre).
  - `<path>` envuelto en backticks exactos; el path unwrapped, resuelto con `path.resolve`, empieza por `path.resolve(REPO_ROOT)` — es absoluto y vive dentro del repo. Los asserts y contratos portables no contienen literales del host (p. ej. `/home/jete/`).
  - `Scope` de cada fila: `project`.
- **Conteo**: exactamente **22 filas** project-skill en el contrato actual (Check B step 2c).

### Comando canónico

La regeneración se ejecuta exclusivamente con:

```bash
gentle-ai skill-registry refresh --force
```

`.atl/skill-registry.md` es **salida generada**: no se edita a mano, no se reconstruye desde memoria y no se sustituye por otro generador sin revisar el contrato de formato. Una edición manual o un output de otro generador producen RED loud en el test, no una excepción. La regeneración es una acción `coordinator-only` (WU-REG-1 de `20260804-drift-cleanup-projectctl`), no una unidad de apply.

### Las 22 project skills emitidas

El generador emite exactamente estas 22 project skills (nombres tal como aparecen en el output, uno por fila):

`astro`, `backend-api-policy`, `bun-runtime`, `chained-pr`, `cloudflare-tunnel`, `coordinador`, `find-skills`, `frontend-policy`, `fsd-architecture`, `git-commit`, `judgment-day`, `playwright-cli`, `playwright-e2e-testing`, `projectctl-requirements`, `sandbox-runtime-policy`, `sd-protocol`, `skill-creator`, `solidjs`, `supabase-data-policy`, `supabase-postgres-best-practices`, `webhook-development`, `work-unit-commits`

### Exclusión de workflow skills `sdd-*` (contrato del generador)

El generador **excluye deliberadamente** del índice las workflow skills `sdd-*`: `sdd-init`, `sdd-explore-code`, `sdd-explore-research`, `sdd-explore-pwcli`, `sdd-propose`, `sdd-spec`, `sdd-design`, `sdd-tasks`, `sdd-apply-code`, `sdd-apply-unit-tests`, `sdd-apply-pwauto-tests`, `sdd-apply-doc`, `sdd-verify-code`, `sdd-verify-units`, `sdd-verify-pwauto`, `sdd-verify-pwcli`. Que no aparezcan como fila del registry **no es drift**: es el contrato del generador (el índice es delegator-use para selección de skills, no el catálogo de lanes del binding). Esas lanes siguen siendo resolubles en disco vía `<REPO_ROOT>/.agents/skills/<skill>/SKILL.md` (Check A del test: lane → disco), independientemente de su ausencia en el registry.

### Regla semver anti-drift

Cualquier cambio futuro del generador que altere el **formato** o el **scope** del output — row shape (columnas, backticks discipline, derivación del path), header `Auto-generated`, conteo de filas emitidas (hoy exactamente 22) o la exclusión de `sdd-*` — **MUST bumpear `metadata.version`** del package `projectctl-requirements` per la tabla de bump de §5 (Versionado cross-repo) antes del siguiente cierre de ciclo (R-MAINT-4). El test `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` es la guarda: ante un cambio de formato o scope, Check B produce RED loud (sin `skip`, `it.skip` ni `if (...) return` silencioso) hasta que el contrato se actualice y el bump se registre. El cambio que introduce esta sección (`20260804-drift-cleanup-projectctl`) se clasifica como **PATCH semver** (design §9.2): documenta un contrato ya emitido por el generador sin alterar su formato; el bump efectivo de `metadata.version` lo aplica el autor de la PR al cierre del ciclo per R-MAINT-4.
