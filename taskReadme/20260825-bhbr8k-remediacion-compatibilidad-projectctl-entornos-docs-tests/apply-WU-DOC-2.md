# APPLY-WU-DOC-2 — Evidencia de implementación documental (fase 4, completamiento)

> Lane: `sdd-apply-doc` (apply_lane `doc`, phase artifact `apply-WU-DOC-2`).
> Task: `20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests`
> Fase: `fase_4_documentacion` (`p4_documenting` / `documenting`) — única lane `sdd-apply-doc`.
> Criterios de aceptación: **AC-002** (coherencia bundle §4 vs `criteria[]`) + **AC-005**
> (prerrequisitos cross coherentes; `sandbox-runtime-policy` instalada/registrada).
> REQs cerrados: REQ-CRS-003 (coherencia `agents_skills.md` ↔ `.atl/skill-registry.md`),
> REQ-DOC-001..005 (coherencia bundle/navigation/criteria[]), REQ-ENT-005/ENT-006
> (docs entorno presentes + skill instalada → sin deuda documental en coherencia).
> Gate objetivo: `documentation_apply_evidence_complete` → `p4_reviewing` → `documentation_gate_passed`
> (hard_gate) → `p4_complete`.
> Index-primary: esta lane NO escribe el índice; escribe este artifact y retorna
> `summary` + `artifact_ref` + `unit_status` (sdd-phase-common §F.5). Sin mirrors (`mirrors: []`).

---

## 1. Scope / work unit ejecutada

WU-DOC-2 es una **unidad de completamiento autorizada por el coordinador en fase 4**
(no figura en el breakdown de fase 2 de `tasks.md`; su contrato llega por la instrucción
inyectada del coordinador — ver §2 y §3). Cierre de la deuda documental de coherencia para
que el hard gate `documentation_gate_passed` sea certificable.

| Campo | Valor |
| --- | --- |
| Unit | `WU-DOC-2` |
| apply_lane | `doc` |
| Objetivo | Cerrar deuda documental de coherencia: (a) `sandbox-runtime-policy` de "prevista" → "instalada" en `agents_skills.md` (REQ-CRS-003/ENT-006); (b) fila §4 del bundle `PCT-89..94` inconsistente con el reclass de PCT-89 (WU-DOC-1 rev 2); (c) anti-drift de `docs/04-process/task.md` (SoT única = binding v9.0.0, sin catálogos duplicados); (d) read-only: `navigation.yaml` + `criteria[]` sin drift |
| Archivos owned | `docs/00-context/agents_skills.md` (MODIFIED); `docs/app-map/views/projectctl/index.md` (MODIFIED solo fila §4); `docs/04-process/task.md` (verificar/fix si drift — resultó coherente, sin cambios); `docs/app-map/navigation.yaml` (read-only verify); `criteria[]` del bundle (read-only verify) |
| Depende de | WU-DOC-1 rev 2 (reclass PCT-89), WU-ENT-3 (skill instalada), WU-TST-1/WU-TST-2 (cobertura unit real), WU-VER-UNITS rev 3 (matriz 23/23) |
| Conflict group | docs |
| Modo | serial (fase 4, única lane) |
| Spec scenarios linked | REQ-CRS-003, REQ-DOC-001..005 (coherencia), REQ-ENT-005/006 (coherencia) |
| Routing tag on failure | `doc_issue` |

## 2. Documentación actualizada (evidencia "documentación actualizada")

### 2.1 `docs/00-context/agents_skills.md` (MODIFIED) — REQ-CRS-003 / REQ-ENT-006

`sandbox-runtime-policy` pasa de **prevista → instalada**:

- **Tabla "Skills instaladas (project)"**: añadida la fila `sandbox-runtime-policy`
  (orden alfabético, entre `projectctl-requirements` y `sd-protocol`) con su trigger canónico
  (sandbox runtime, docker CLI, docker.sock, projectctl runtime control, no-docker, PTY) y el
  resumen del contrato de la skill instalada (PCT-99: NO expone docker CLI/socket; control de
  runtime exclusivo vía `projectctl`).
- **Sección "Skills previstas / a instalar"**: **eliminada** — no quedan skills pendientes;
  el inventario completo está instalado. Con esto, 0 ocurrencias de "prevista" en el archivo.
- **Resumen "Skills por superficie"**: `sandbox-runtime-policy` listada en Runtime sin marca
  de estado pendiente, simétrica al resto de las entries.

**Coherencia verificada con `.atl/skill-registry.md`** (WU-REG, coordinator-owned, NO tocado):
el registro ya incluye `sandbox-runtime-policy` con `Scope: project` y path
`REPO_ROOT/.agents/skills/sandbox-runtime-policy/SKILL.md` — el skill está instalado en disco
(`.agents/skills/sandbox-runtime-policy/SKILL.md`, v1.0.0). Ambos documentos (registro máquina
+ lectura legible) nombran el mismo conjunto: **6 skills project-installed**.

### 2.2 `docs/app-map/views/projectctl/index.md` — solo fila §4 (MODIFIED) — REQ-DOC-005/001

Inconsistencia reportada por WU-DOC-1 rev 2 / verify-units: la fila rango
`PCT-89..94 (test) | … | implemented | covered | covered` no reflejaba el reclass de PCT-89 a
`not-applicable` (panel Test = superficie UI de la plataforma, no de este repo consumidor —
decisión WU-DOC-1 rev 2, precedente cli PCT-79..82). Fila **split/rephrase** en §4:

| Antes (rev 1/2 del bundle) | Después (WU-DOC-2) |
| --- | --- |
| `PCT-89..94 (test)` → implemented / covered / covered | `PCT-89 (test)` → **not-applicable** (plataforma) **+** `PCT-90..94 (test)` → implemented / covered / **covered (PCT-91)** |

La nueva fila `PCT-90..94` documenta la cobertura unit real de la matriz
(WU-VER-UNITS rev 3): Unit `endpoints.test.ts` (PCT-90/93) +
`test-runner-contract.test.ts` (PCT-91/92/94); Manual `covered (PCT-91)` (CLI `projectctl test`,
coordinator-owned) — los demás criterios test tienen Manual `not-applicable` en frontmatter.

**Scope estricto**: se tocó SOLO la fila §4 del rango test. No se modificaron los bloques
`criteria[]` del frontmatter, ni title/coverage de ningún criterio, ni otras secciones del
bundle, ni `index.mmd` (los criterios declarados ya eran coherentes con la matriz rev 3).

### 2.3 `docs/04-process/task.md` (verificado — sin cambios)

Anti-drift verificado y **coherente**: cita el bloque `task-flow-binding` (`TaskFlowBindingV1`,
v9.0.0) en `.agents/skills/projectctl-requirements/references/tareas.md` como **única SoT
normativa** (líneas 3-7, 11-14, 60); declara explícitamente que fases/estados/lanes/gates se
leen solo del binding (líneas 16-19, 40-44, 50); **0 filas de tabla de estados/lanes/gates**
duplicadas (probe: 0 tablas `p[0-9]`/lane). No requería corrección → **no modificado** (la
regla "MODIFIED only if a coherence correction is needed" no se activa).

### 2.4 `docs/app-map/navigation.yaml` (read-only verify — sin cambios)

Parseo YAML OK (`Bun.YAML.parse`): `root_id: home`; vistas `home`, `project-workspace`,
`projectctl`; nodo `projectctl` = `{id: projectctl, title: Projectctl, kind: view, bundle:
views/projectctl/index, children: []}` — registra el bundle correctamente (REQ-DOC-003).

### 2.5 `criteria[]` del bundle (read-only verify — sin cambios)

28 criterios `PCT-*`, sin duplicados, shape `{id,title,functional,coverage}` válida;
`functional ∈ {implemented, partial, missing, not-applicable}`; métodos/estados de cobertura
dentro del contrato. Reglas chequeadas: todo `implemented` declara `Unit: covered`;
`PCT-89` `functional: not-applicable` con los 4 métodos `not-applicable`; PCT-90/91/92/93/94
`Unit: covered` (PCT-91 además `Manual: covered`); PCT-79..82 not-applicable; PCT-95..100 y
PCT-106/107/109/110/112/121 `implemented` + `Unit: covered`. **Coherente con la matriz de
verificación rev 3 (23/23 implementados cubiertos + PCT-79..82/89 no aplicables).**

## 3. Spec/design criteria satisfied

| REQ / criterio | Satisfecho | Evidencia |
| --- | --- | --- |
| REQ-CRS-003 (agents_skills.md coherente con registro) | ✅ | `sandbox-runtime-policy` instalada en tabla project; coherente con `.atl/skill-registry.md` (ya registrada, WU-REG) |
| REQ-ENT-006 (skill sandbox-runtime-policy instalada) | ✅ | skill presente en `.agents/skills/sandbox-runtime-policy/SKILL.md` (v1.0.0) y reflejada como instalada |
| REQ-ENT-005 (docs entorno) | ✅ (verify) | `docs/00-context/entornos.md` + `architecture.md` + `docs/02-features/tunnel.md` presentes (no tocados) |
| REQ-DOC-001/002/003 (bundle + mmd + navigation) | ✅ (verify, sin cambios) | bundle 5 secciones MUST + `index.mmd` + nodo navigation OK |
| REQ-DOC-004 (quality legacy eliminada) | ✅ (verify) | `docs/01-product/**` vacío; sin superficie paralela |
| REQ-DOC-005 (prefix discipline) | ✅ (verify, sin cambios) | 28/28 IDs `PCT-*`; sin prefijo inventado |
| Coherencia §4 vs `criteria[]` (PCT-89/90..94) | ✅ | fila §4 split: PCT-89 not-applicable, PCT-90..94 unit-covered (mapping por archivo) |

## 4. Archivos modificados

| Archivo | Acción |
| --- | --- |
| `docs/00-context/agents_skills.md` | MODIFIED (sandbox-runtime-policy prevista→instalada; sección previstas eliminada; resumen superficie) |
| `docs/app-map/views/projectctl/index.md` | MODIFIED (SOLO fila §4 rango test: PCT-89 + PCT-90..94) |
| `docs/04-process/task.md` | verificada, **sin cambios** (coherente) |
| `docs/app-map/navigation.yaml` | read-only verify, **sin cambios** |
| `docs/app-map/views/projectctl/index.md` `criteria[]` | read-only verify, **sin cambios** |
| `taskReadme/20260825-bhbr8k-.../apply-WU-DOC-2.md` | NEW (este artifact de evidencia) |

No se tocó `.atl/skill-registry.md` (coordinator-owned, WU-REG). No se tocó producto/tests/
índice.

## 5. Verify expects (concretos)

| Expect | Resultado |
| --- | --- |
| `grep sandbox-runtime-policy docs/00-context/agents_skills.md` → instalada (sin "prevista") | ✅ 3 matches (tabla instaladas, coherencia, superficie); **0** ocurrencias de "prevista" |
| Bundle §4 fila test refleja PCT-89 not-applicable + PCT-90..94 unit-covered | ✅ split en 2 filas; Mapping unit por archivo (endpoints / test-runner-contract) |
| `task.md` contiene ref `task-flow-binding` y sin tablas de estados/lanes duplicadas | ✅ ref v9.0.0 única SoT; 0 tablas duplicadas |
| YAML parsea (Bun.YAML.parse read-only) navigation.yaml + frontmatter bundle | ✅ ambos PARSE OK; nodo projectctl correcto |
| `criteria[]` coherentes | ✅ 28/28; implemented→Unit:covered; PCT-89 not-applicable; sin duplicados |
| no_documentation_debt checklist | ✅ ver §8 |

## 6. Desviaciones de diseño

- **Ninguna** respecto a la instrucción inyectada del coordinador (delta = exactamente los
  owned files y el split §4 autorizado).
- **Decisión de apply (registrada)**: la sección "Skills previstas / a instalar" de
  `agents_skills.md` quedó vacía tras el update; se **eliminó** en vez de dejarla hueca
  (evita un "prevista" residual en el heading y confusión de estado). La transición
  prevista→instalada queda evidenciada por la fila en la tabla "Skills instaladas (project)".

## 7. Follow-up / próximo paso

- `next_recommended`: transición del coordinador a `p4_reviewing` (gate
  `documentation_apply_evidence_complete`) → evaluación del hard gate `documentation_gate_passed`
  → `p4_complete` → `WU-REG` (regen formal `.atl/skill-registry.md` — coordinator-only, ya
  coherente con este artifact) → delivery (`final_commit_pending` → `final_push_pending` →
  `final_pr_pending`).
- `unresolved follow-up`: `none` dentro del scope de esta lane (residuales de fase 3/§18 del
  índice siguen siendo del coordinador: runtime trackeado → `git rm --cached`; residual
  plataforma `model_unavailable`).

## 8. Check de deuda documental (no_documentation_debt)

| Área | Estado | Evidencia |
| --- | --- | --- |
| Agent (`AGENTS.md`) | ✅ presente (WU-CRS-2) | operación de agentes, SoT normativa referenciada |
| Binding (locator + SoT única) | ✅ | `.agents/sdd-workflow.json` pin v9.0.0 (WU-TSK-1); `task.md` cita `task-flow-binding` v9.0.0 como única SoT; sin catálogos paralelos |
| Client (`README.md`) | ✅ presente (WU-CRS-2) | entry points sin duplicar policy |
| App-map (bundle + navigation + mmd) | ✅ | 5 secciones MUST + `criteria[]` PCT-* + `index.mmd` + nodo navigation; única SoT funcional |
| Criteria (`criteria[].coverage`) | ✅ | 28/28 coherentes; implemented→Unit:covered; PCT-89 not-applicable; sin drift vs matriz rev 3 |
| Sources (skill cites / standard) | ✅ | `standard.md`/`doc.md` citados; sin material normativo reemplazado ni duplicado |
| Mirrors | ✅ | `mirrors: []` → `write_order: ["primary"]`; sin deuda de mirror |
| Superficie legacy | ✅ | `docs/01-product/quality/**` ausente (glob vacío); sin archivos paralelos de cobertura |
| Registro de skills | ✅ coherente | `agents_skills.md` (6 skills instaladas) ↔ `.atl/skill-registry.md` (registro ya incluye `sandbox-runtime-policy`, project) |

## 9. File-surface check (obligatorio §D sdd-phase-common)

- `docs/00-context/agents_skills.md`, `docs/app-map/views/projectctl/index.md` → MODIFIED
  tracked bajo `docs/`; commit normal (no gitignored, no generados). Clasificación: commit
  normal.
- `taskReadme/20260825-bhbr8k-.../apply-WU-DOC-2.md` → phase artifact; commit normal.
- Sin archivos gitignored/generados/local-only tocados por esta lane; sin `force-add`
  requerido. Esta lane no ejecutó git/gh (mecánica de commit/PR = coordinador).
- Riesgo delivery conocido (ajeno a esta lane, ya registrado ver §18 índice): ~149 archivos
  `.runtime/` + `frontend/test-results/.last-run.json` trackeados → `git rm -r --cached` en
  WU-DELIVERY.

---

**criteria_covered**: [AC-002, AC-005]
**unit_status**: `done`
**artifact_ref**: `taskReadme/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests/apply-WU-DOC-2.md`
**documentacion_actualizada**: sí — agents_skills.md (skill instalada), bundle §4 (split PCT-89/PCT-90..94); task.md/navigation.yaml/criteria[] verificados sin cambios
**next_recommended**: `p4_reviewing` → `p4_complete` → delivery

---

# REV 3 — REWORK del contrato Compose del repo (ground truth plataforma)

> Fase: `runtime-fix` re-open (registro del coordinador). REV 3 de **WU-DOC-2**.
> Objetivo: actualizar la documentación del repo para reflejar el **contrato Compose real
> que valida la plataforma** (ground truth del `webhook-listener` — `config.js` / `paths.js` /
> `managed-dev.js`), en lugar del contrato de 2 overlays que documentaban las rev 1/2.
> Docs-only: sin producto, sin tests, sin índice, sin git/gh.

## 1. Contrato Compose corregido (ground truth de la plataforma)

| Valor | Contrato real (webhook-listener) | Documentado por este rework |
| --- | --- | --- |
| Archivos Compose | `compose.yml` (BASE: redes `internal` + `edge` `mis-proyectos-edge`) + `compose.prod.yml` + `compose.dev.yml` | ✅ `docs/00-context/entornos.md` §1 |
| Servicios prod | `frontend-prod` + `api-prod` | ✅ §1 |
| Servicios dev | `frontend-dev` + `api-dev` | ✅ §1 |
| Ejecución plataforma | `docker compose -f compose.yml -f compose.<mode>.yml` + overlay runtime (container_name, `API_URL`, bind-mounts `frontend/src` + `api/src`) | ✅ §1 |
| No colisión con ROOT stack | nombres `frontend`/`api`/`tunnel`/`sandbox`/`webhook-listener`/`root-tunnel-sync` quedan para la plataforma | ✅ §1 |
| Puerto | `FRONTEND_PORT=4321`; prod en `4321`, dev cae al siguiente libre (p. ej. `4324`) | ✅ §2 |
| Edge | prod `colpruebas-origin`, dev `test-colpruebas-origin`; red `mis-proyectos-edge` | ✅ §3 |
| Tunnel | hostnames prod `test.colpruebas.online` / dev `colpruebas.online`; activación `POST /tunnel-tokens/<id>/activate` | ✅ §3 |
| Runtime | exclusivo vía `projectctl`; sandbox sin Docker | ✅ §4 (preservado) |

## 2. Archivos owned (REV 3)

| Archivo | Acción rev 3 |
| --- | --- |
| `docs/00-context/entornos.md` | **MODIFIED** — §1 reescrito al contrato real de 3 archivos + naming por entorno; §2 añade asignación de puerto por plataforma (prod 4321, dev fallback); §3 aliases/hostnames/activación por entorno; §4 preservado (projectctl-only) |
| `docs/app-map/views/projectctl/index.md` | **NO modified** — condicional no activado: las `notes` de PCT-96 son genéricas y NO referencian la wording vieja `compose.yml→prod`; el `title` de PCT-96 sí menciona la wording vieja pero el scope rev 3 prohíbe tocar id/title/functional/coverage. Reportado (ver §5). |

## 3. Documentación actualizada (REV 3)

### 3.1 `docs/00-context/entornos.md` (MODIFIED)

- **§1 Overlays canónicos**: de 2 overlays (`compose.yml` prod + `compose.dev.yml` dev, servicio
  `frontend`) → **3 archivos canónicos**: `compose.yml` BASE (solo redes `internal` + `edge`
  `mis-proyectos-edge`), `compose.prod.yml` (PROD overlay: `frontend-prod` + `api-prod`),
  `compose.dev.yml` (DEV overlay: `frontend-dev` + `api-dev`). Añade el comando de ejecución de
  la plataforma (`-f compose.yml -f compose.<mode>.yml` + overlay runtime) y la regla de NO
  colisión de nombres de servicio con el stack ROOT.
- **§2 `FRONTEND_PORT`**: añade la asignación por entorno de la plataforma (prod `4321`, dev
  fallback automático al siguiente libre, p. ej. `4324`); conserva `FRONTEND_PORT=4321`
  canónico, `.env`/`.env.dev` gitignored y `projectctl env validate`.
- **§3 Contrato edge**: servicio por entorno (`frontend-prod`/`frontend-dev`) en la declaración
  de aliases; hostnames por entorno (prod `test.colpruebas.online`, dev `colpruebas.online`) y
  activación de token vía `POST /tunnel-tokens/<id>/activate`; conserva `mis-proyectos-edge`
  external, alias `<app>-origin` / `test-<app>-origin` y el guardrail `TUNNEL_NOT_PUBLISHABLE`.
- **§4 Runtime**: preservado sin cambios (exclusivo vía `projectctl`, sandbox sin Docker).

### 3.2 `docs/app-map/views/projectctl/index.md` — NO modificado (reportado)

Las `notes` del criterio **PCT-96** son genéricas:
> "Entregado por AC-001 (AD-01). Manual vía projectctl status (coordinator-owned)."

No referencian la wording vieja `compose.yml→prod` → per el scope rev 3
("ONLY if the PCT-96 criteria notes/summary reference the old wording"), **no se activa la
modificación**; se dejan intactas y se reporta. El `title` de PCT-96 sí cita `compose.yml (prod) /
compose.dev.yml (dev)`, pero rev 3 prohíbe tocar id/title/functional/coverage del criterio, por lo
que se conserva tal cual y queda señalado como riesgo de wording residual (ver §5).

## 4. Verify expects (REV 3)

| Expect | Resultado |
| --- | --- |
| `docs/00-context/entornos.md` describe base `compose.yml` + overlays `compose.prod.yml`/`compose.dev.yml` | ✅ §1 (3 archivos + rol BASE/overlays) |
| Servicios `frontend-prod`/`api-prod` (prod) y `frontend-dev`/`api-dev` (dev) | ✅ §1 tabla por entorno |
| No recomienda `frontend`/`api` como nombres de servicio del proyecto | ✅ §1 regla de no colisión con ROOT stack + nombres por entorno |
| `FRONTEND_PORT=4321` + fallback de asignación | ✅ §2 (prod 4321, dev fallback libre) |
| Edge aliases por entorno + hostnames + activación | ✅ §3 (alias + hostnames + `POST /tunnel-tokens/<id>/activate`) |
| Runtime solo vía `projectctl` | ✅ §4 preservado |
| YAML parsea si el bundle fue tocado | N/A — bundle NO tocado; `entornos.md` es Markdown plano |

## 5. Desviaciones de diseño y riesgos (REV 3)

- **Bundle no tocado (decisión de apply)**: las `notes` de PCT-96 son genéricas → condicional no
  activado → `docs/app-map/views/projectctl/index.md` queda **sin cambios**, señalado como
  report (`not modified`).
- **Riesgo de wording residual (reportado)**: el `title` de PCT-96 del bundle preserva la wording
  vieja `compose.yml (prod) / compose.dev.yml (dev)`; quedó intacto por la prohibición rev 3 de
  cambiar id/title/functional/coverage. Si el coordinador/equipo decide alinear el `title` al
  contrato real (3 archivos + naming por entorno), requiere una excepción de scope o WU dedicada
  (no cabe en esta rev 3 con el scope estricto otorgado).
- **Riesgo delivery**: mismo riesgo global ya registrado (§9 rev 1/2): artefactos `.runtime/` +
  `frontend/test-results/.last-run.json` trackeados → `git rm -r --cached` en WU-DELIVERY
  (coordinator). Documentación `docs/**` y phase artifact = commit normal (no gitignored).

---

**rev**: 3
**criteria_covered**: [AC-001, AC-002, AC-005]
**unit_status**: `done`
**doc_files_modified**: `docs/00-context/entornos.md`
**doc_files_reviewed_not_modified**: `docs/app-map/views/projectctl/index.md` (notes PCT-96 genéricas)
**artifact_ref**: `taskReadme/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests/apply-WU-DOC-2.md`
**next_recommended**: verify-units re-run (docs no impactan gate unit, confirmar) + commit/PR del coordinador
**skill_resolution**: `injected-paths`