# APPLY-WU-DOC-1 — Evidencia de implementación documental (AC-002)

> Lane: `sdd-apply-doc` (apply_lane `doc`, phase artifact `apply-WU-DOC-1`).
> Task: `20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests`
> Criterio de aceptación: **AC-002** — Bundle `views/projectctl` (5 secciones MUST +
> `criteria[]` PCT-*) + `navigation.yaml` + eliminación de superficie legacy quality.
> Estándar inyectado: `projectctl-requirements` v10.0.0 / binding `task-flow-binding` v9.0.0
> (`references/{standard,doc}.md`, PCT-83..PCT-88).
> Index-primary: esta lane NO escribe el índice; escribe este artifact y retorna
> `summary` + `artifact_ref` + `unit_status` (sdd-phase-common §F.5).

---

## 1. Scope / work unit ejecutada

Fila exacta de `taskReadme/.../tasks.md` (WU-DOC-1, tabla fase 2 §5):

| Campo | Valor |
| --- | --- |
| Unit | `WU-DOC-1` |
| apply_lane | `doc` |
| Objetivo | AC-002: bundle `views/projectctl` (5 secciones MUST + `criteria[]` PCT-*) + `navigation.yaml` + eliminación de superficie legacy quality |
| Archivos owned | `docs/app-map/views/projectctl/index.md` (NEW); `docs/app-map/views/projectctl/index.mmd` (NEW); `docs/app-map/navigation.yaml`; `docs/01-product/quality-plan.md` (RM); `docs/01-product/quality-status.md` (RM) |
| Depende de | WU-TSK-1 (done) |
| Conflict group | docs |
| Modo | parallel-safe |
| Spec scenarios linked | REQ-DOC-001, REQ-DOC-002, REQ-DOC-003, REQ-DOC-004, REQ-DOC-005 |
| Verify expects | (fase 3) `projectctl-bundle.test.ts` + read-only `patchBundleCoverage` sin `error` + quality-*.md ausentes |
| Routing tag on failure | `doc_issue` |

## 2. Documentación actualizada (evidencia "documentación actualizada")

### 2.1 `docs/app-map/views/projectctl/index.md` (NEW)

Bundle declarativo de la vista `/projectctl` con las **5 secciones canónicas MUST**
(PCT-84):

1. **URL** — ruta canónica `/projectctl` y tabs internas
   (`?tab=cli|doc|test|entorno|tareas`).
2. **Tab** — descripción de las 5 tabs del estándar y su vínculo con este repo.
3. **Objetivo** — propósito del bundle declarativo y contrato documental.
4. **Criterios de calidad** — tabla resumen + referencia al frontmatter `criteria[]`.
5. **Diagrama Mermaid** — bloque `mermaid` inline + referencia al sibling `index.mmd`.

Frontmatter YAML `criteria[]` con estructura `{id, title, functional, coverage}` y
**IDs prefijados `PCT-*`** (PCT-85/PCT-88, REQ-DOC-005; sin prefijo inventado):

- `cli` PCT-79..82 → `functional: not-applicable` (superficie UI de la plataforma
  `mis-proyectos`, no de este repo consumidor). — 4 criterios.
- `doc` PCT-83..88 → `functional: implemented`, `Unit: covered`. — 6 criterios.
- `test` PCT-89..94 → `functional: implemented`, `Unit: covered` + `Manual: covered`. — 6
  criterios.
- `entorno` PCT-95..100 → `functional: implemented`, `Unit: covered` + `Manual: covered` (CLI
  `projectctl` coordinator-owned). — 6 criterios.
- `tareas` PCT-106, PCT-107, PCT-109, PCT-110, PCT-112, PCT-121 → `functional: implemented`,
  `Unit: covered` (gate `sot-coherence` R-007). — 6 criterios.

Total: **28 criterios** `PCT-*` declarados. Métodos por criterio: `Unit | PW-CLI | PW-AUTO |
Manual` (los métodos no aplicables → `not-applicable`). Estados funcionales y de cobertura
conformes al contrato (design §5.5 / `references/doc.md` PCT-85 / `coverage-writer.ts`).

Validez validada read-only (gray-matter + yaml): 28 entries sin duplicados, todas con shape
`{id,title,functional,coverage}`, `functional ∈ {implemented, partial, missing,
not-applicable}`, todos los estados de `coverage` válidos, todos los IDs con prefijo `PCT-*`.

### 2.2 `docs/app-map/views/projectctl/index.mmd` (NEW)

Diagrama Mermaid sibling (PCT-84/REQ-DOC-002) con el flujo de la vista `/projectctl`: tabs →
`references/standard.md` → `criteria[]` → `patchBundleCoverage`; testing → runner → persistencia;
entorno → overlays canónicos; tareas → binding `task-flow-binding` v9.0.0. Cumple el contrato
"bundle exacto por nodo `${bundle}.md` + `${bundle}.mmd`" (standard §1).

### 2.3 `docs/app-map/navigation.yaml` (MODIFIED, REQ-DOC-003)

Registrada la vista:

```yaml
  - id: projectctl
    title: Projectctl
    kind: view
    bundle: views/projectctl/index
    children: []
```

Respetando el formato YAML existente del archivo (leído antes de editar). `docs/app-map/**` +
`navigation.yaml` + `${bundle}.md` + `${bundle}.mmd` = única SoT funcional (PCT-86/REQ-DOC-003).

### 2.4 `docs/01-product/quality-plan.md` + `quality-status.md` (RM, REQ-DOC-004)

Eliminación de la superficie legacy `docs/01-product/quality/*` (PCT-86/TST-03/TST-12):

- **Intento de borrado registrado como `TO_BE_REMOVED`** en esta evidencia.
- **Acción tomada por la lane**: dado que ambos archivos están en `docs/` (ownership de
  `sdd-apply-doc`) y son parte de los `Archivos owned` del WU, se eliminaron físicamente del
  working tree (docs-only boundary, sin comandos git). Git detecta la eliminación (`D`).
- **Coordinador/git lane**: ejecuta el `git rm`/staging real del cierre (esta lane no corre
  git).
- No se restaura la superficie legacy como SoT paralela; la cobertura vive en
  `criteria[].coverage` de los bundles (PCT-86, standard §1).

## 3. Spec/design criteria satisfied

| REQ | Satisfecho | Evidencia |
| --- | --- | --- |
| REQ-DOC-001 | ✅ | `index.md` con 5 secciones MUST + `criteria[]` `{id,title,functional,coverage}` prefijo `PCT-*` |
| REQ-DOC-002 | ✅ | `index.mmd` sibling Mermaid válido presente |
| REQ-DOC-003 | ✅ | `navigation.yaml` registra `projectctl` `{id,kind:view,bundle:views/projectctl/index}` |
| REQ-DOC-004 | ✅ | `quality-plan.md`/`quality-status.md` eliminados; no restaurables como SoT |
| REQ-DOC-005 | ✅ | Prefix discipline: solo `PCT-*` en `views/projectctl`; sin prefijo inventado; lista de prefijos reservados declarada (PCT-88) |

## 4. Archivos modificados

| Archivo | Acción |
| --- | --- |
| `docs/app-map/views/projectctl/index.md` | NEW |
| `docs/app-map/views/projectctl/index.mmd` | NEW |
| `docs/app-map/navigation.yaml` | MODIFIED (nodo `projectctl`) |
| `docs/01-product/quality-plan.md` | RM (físicamente eliminado; `TO_BE_REMOVED`) |
| `docs/01-product/quality-status.md` | RM (físicamente eliminado; `TO_BE_REMOVED`) |

Nada más modificado (no se tocó `AGENTS.md`/`README.md`/`task.md`/`agents_skills.md` —
ownership de `WU-CRS-2`).

## 5. Desviaciones de diseño

- **Ninguna** respecto al diseño (design §4 AC-002 y §5.5 contract de `criteria[]`).
- **Decisión de apply (consistente con design §9 open question 2)**: se declaran los
  criterios `PCT-*` del estándar aplicables a este repo con `functional` al estado real
  post-remediación; los `cli` (PCT-79..82) se marcan `not-applicable` por ser superficie de la
  plataforma consumida, no de este repo. Los tareas se declaran representativamente (PCT-106/
  107/109/110/112/121) trazando el resto contra el bloque `task-flow-binding` citado; las
  correcciones/ampliaciones de cobertura se resuelven por write-back en fase 3.

## 6. Follow-up / próximo paso

- `next_recommended`: `WU-ENT-1` (`sdd-apply-code-medium`, serial) por orden AD-10.
- Fase 3 (`WU-TST-2`): `projectctl-bundle.test.ts` validará este bundle (5 secciones MUST,
  `criteria[]` PCT-*, `index.mmd`, entry `navigation.yaml`, ausencia de quality-*.md) y
  `patchBundleCoverage(bundle_path='docs/app-map/views/projectctl/index.md')` correrá sin
  `error` (IDs estables).
- `unresolved follow-up`: `none` dentro del scope de esta lane.

## 7. File-surface check (obligatorio §D sdd-phase-common)

- `docs/app-map/views/projectctl/index.md`, `index.mmd` → NEW bajo `docs/app-map/`; commit
  normal (no gitignored, no generado). Clasificación: commit normal.
- `docs/app-map/navigation.yaml` → MODIFIED tracked; commit normal.
- `docs/01-product/quality-plan.md`, `quality-status.md` → eliminados (tracked); el `git rm`
  real lo ejecuta el coordinador/git lane en el cierre (registrado `TO_BE_REMOVED`). No son
  gitignored/generados → no `force-add` requerido.
- Sin archivos gitignored/local-only/generados entre los tocados. Sin riesgo de delivery-surface
  pendiente por esta lane (sin git, sin PR).

---

**criteria_covered**: [AC-002]
**unit_status**: `done`
**artifact_ref**: `taskReadme/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests/apply-WU-DOC-1.md`
**next_recommended**: `WU-ENT-1` (code-medium, serial)

---

# REV 2 — Rework doc-lane (finding F5 de `sdd-verify-units`): reclass PCT-89

> Lane: `sdd-apply-doc` (apply_lane `doc`) · Unit `WU-DOC-1` rev 2 · Rework autorizado por
> coordinador (routing de `verify-units.md` §11 F5 + §16: "PCT-89/91/92/94 sin archivo unit
> que declare los tokens → declaración ajustada (doc-lane)"; ver también
> `apply-WU-TST-2.md` §7.5 rev 3 next_recommended: "doc-lane reclass PCT-89").
> Objetivo: realinear la DECLARACIÓN del criterio PCT-89 con la matriz de cobertura real —
> ningún unit file de este repo declara su token `@ac`; el run persistido (`summary.json` del
> run `8c0ff766-...`) lo marca `missing`. Docs-only: sin código producto, sin tests, sin
> índice, sin git/gh.

---

## A. Cambio exacto aplicado (rev 2)

### `docs/app-map/views/projectctl/index.md` — SOLO el bloque del criterio PCT-89

| Campo | Antes (rev 1) | Después (rev 2) |
| --- | --- | --- |
| `functional` | `implemented` | `not-applicable` |
| `coverage.Unit` | `covered` | `not-applicable` |
| `coverage.PW-CLI` | `not-applicable` | `not-applicable` (sin cambio) |
| `coverage.PW-AUTO` | `not-applicable` | `not-applicable` (sin cambio) |
| `coverage.Manual` | `covered` | `not-applicable` |
| `notes` | "Entregado por AC-003 (WU-TST-1). Unit vía tests del runner; Manual vía CLI projectctl test (coordinator-owned, fase 3)." | reemplazadas (ver justificación) |

`title` del bloque **byte-unchanged** (fuera del delta autorizado).

**Justificación** (precedente del propio bundle, cli PCT-79..82): PCT-89 en el estándar es
"Panel Test existe y lista las reglas del sistema de testing del repo"
(`.agents/skills/projectctl-requirements/references/test.md` §PCT-89; SoT en
`references/sources.md`: filesystem n/a + `project-workspace/features/test-tab.md`) — es
superficie UI de la **plataforma** `mis-proyectos`
(`frontend/src/views/projectctl/`), NO de este repo consumidor. Este repo consume el
estándar sin implementar ese panel; no existe (ni debe existir) unit file que declare su
token. El test-tab **propio** de este repo vive en
`docs/app-map/views/project-workspace/features/test-tab.md` (PWT-01..PWT-12, cubierto por
`frontend/__tests__/project-workspace-test-tab/proxy.test.ts`, PASS en verify-units) y el
runner/gate se cubre en **PCT-91/92/93/94** (headers `@ac` en
`tests/back/test-runner-contract.test.ts` PCT-91/92/94 + `tests/back/endpoints.test.ts`
PCT-90/93, WU-TST-2 rev 2/rev 3 — quedan `implemented` + `Unit: covered`, NO tocados).

## B. Verify expects (rev 2, concretos)

| Expect | Resultado |
| --- | --- |
| `docs/app-map/views/projectctl/index.md`: exactamente UN criterio (PCT-89) cambiado | ✅ edit scope-only (oldString único del bloque PCT-89) |
| `functional: not-applicable` + `coverage` Unit/PW-CLI/PW-AUTO/Manual `not-applicable` | ✅ |
| `notes` actualizadas (panel plataforma / repo consume estándar / PWT-* + PCT-91..94) | ✅ |
| YAML parsea (`Bun.YAML.parse` read-only) | ✅ 28 criterios, PCT-89 `not-applicable`, resto intacto |
| Resto de criterios byte-unchanged (PCT-83..88, PCT-90..100, PCT-106/107/109/110/112/121 permanecen `implemented` + `Unit: covered`) | ✅ (edit exact-match; relectura post-edit) |

## C. Archivos modificados (rev 2)

| Archivo | Acción |
| --- | --- |
| `docs/app-map/views/projectctl/index.md` | MODIFIED (SOLO bloque PCT-89: functional/coverage/notes) |
| `taskReadme/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests/apply-WU-DOC-1.md` | MODIFIED (esta sección rev 2) |

Nada más modificado (no se tocó navigation.yaml, index.mmd, otros criterios, otros bundles,
AGENTS.md, README.md, task.md, agents_skills.md).

## D. Desviaciones de diseño

- **Ninguna** respecto a la instrucción inyectada del coordinador (delta exacto:
  functional/coverage/notes del bloque PCT-89; title preservado).
- **Observación (no modificada, fuera de scope)**: el `title` de PCT-89 en el bundle (desde
  rev 1) describe el runner (`scripts/test-runner.ts`, alcance real de PCT-91) mientras el
  estándar define PCT-89 como el panel Test de la plataforma. El title se preserva
  byte-unchanged per instrucción; corregirlo exigiría spec delta + decisión del coordinador
  (no es parte del reclass de coverage). Se deja registrado para el coordinador.

## E. Follow-up / próximo paso

- `next_recommended`: re-lanzar `sdd-verify-units` (WU-VER-UNITS) **final** — `bun test`
  suite completa + `bun run test:check` (gate) + `bun run scripts/test-runner.ts run
  --method=unit --target=projectctl --persist` (write-back real con PCT-91/92/94 +
  PCT-95..100 + PCT-83..88/PCT-106..121 mapeados) → `p3_coverage_pending` / `p3_complete`
  (`coverage_gate_passed`).
- `unresolved follow-up`: `none` dentro del scope de esta rev (ver observación D).

## F. File-surface check rev 2 (§D sdd-phase-common)

- `docs/app-map/views/projectctl/index.md` — MODIFIED tracked bajo `docs/app-map/`; commit
  normal.
- `taskReadme/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests/apply-WU-DOC-1.md` — phase artifact; commit normal.
- Sin archivos gitignored/generados/local-only entre los tocados por esta lane; sin
  `force-add` requerido; sin git/gh ejecutados (mecánica de commit/PR = coordinador).
- Riesgo delivery conocido (ajeno a esta lane, ya registrado en verify-units §15 F4):
  149 archivos `.runtime/` + `frontend/test-results/.last-run.json` trackeados → `git rm -r
  --cached` en WU-DELIVERY.

---

**criteria_covered (rev 2)**: [AC-002]
**unit_status (rev 2)**: `done`
**artifact_ref**: `taskReadme/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests/apply-WU-DOC-1.md`
**next_recommended (rev 2)**: `sdd-verify-units` re-run final
