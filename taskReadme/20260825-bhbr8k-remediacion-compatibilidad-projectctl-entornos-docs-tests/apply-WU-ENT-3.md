# APPLY-WU-ENT-3 — Evidencia de implementación (AC-001 ENTORNO)

> Lane: `sdd-apply-code-low` (logical skill id `sdd-apply-code`) · Unit: `WU-ENT-3` · apply_lane: `code-low`
> Objetivo: AC-001 — instalar skill `sandbox-runtime-policy` (copy-tree-no-mods; sandbox sin
> docker, runtime exclusivo `projectctl`) (REQ-ENT-006 / PCT-99).
> Estado de la unit: `done` · Archivo de evidencia: este artifact.
> Estándar inyectado: `projectctl-requirements` v10.0.0 / binding `task-flow-binding` v9.0.0.
> Helper skills task-seleccionadas: NINGUNA (snapshot congelado `{"skills": []}`).
> Contrato aplicable: `references/entorno.md` PCT-99 + `references/standard.md` §3/§4 + spec
> REQ-ENT-006 + design AD-10.

---

## 1. Pre-implementation gate (code-low — scope-only)

| Gate | Resultado | Evidencia |
| --- | --- | --- |
| **Scope** | PASS | Unit `WU-ENT-3`, `apply_lane: code-low`, archivos owned exactos: `.agents/skills/sandbox-runtime-policy/SKILL.md` (NEW). Nada más tocado. |

Para `code-low` solo aplica la fila Scope (sdd-apply-code SKILL §Pre-Implementation Contract
Gate); las otras 4 filas del contrato son responsabilidad del coordinador al asignar la unit.
No se leyeron specs/design como requisito del gate, aunque se consultó REQ-ENT-006 y AD-10 como
contexto de redacción del contenido.

---

## 2. Implementación

### 2.1 Contexto leído (source of truth)

- REQ-ENT-006 (spec): MUST existir `.agents/skills/sandbox-runtime-policy/SKILL.md`; la skill
  MUST declarar que el sandbox NO expone `docker` CLI ni `docker.sock` y que el control de
  runtime es exclusivo vía `projectctl` (`env *`, `tunnel *`,
  `start|stop|restart|rebuild|promote|deploy|doctor`).
- PCT-99 (`references/entorno.md`): sandbox sin Docker; `docker: command not found` es
  comportamiento correcto, NO bug; control EXCLUSIVO vía `projectctl` (`env *` PCT-30..37,
  `tunnel *` PCT-38..45, `start|stop|restart|rebuild|promote|deploy|doctor`); la PTY hospeda
  `projectctl`, la API valida auth + ownership, `webhook-listener` es la única superficie
  privilegiada que ejecuta Docker Compose.
- `references/standard.md` §4: boundary `terminal -> projectctl -> API -> webhook-listener ->
  Docker host`; sandbox no expone Docker CLI ni `docker.sock`.
- Frontmatter estándar de la familia (patrón repo `engram-policy` / `sd-protocol` /
  `projectctl-requirements`): `name`, `description` con trigger, `metadata.{id,version}`,
  `license`, `metadata.categories`.
- `docs/00-context/agents_skills.md` (WU-CRS-2, ya presente): `sandbox-runtime-policy` listada
  como **prevista** — "Declara que el sandbox NO expone docker CLI/socket y que el control de
  runtime es exclusivo vía `projectctl`." (coherente con lo instalado; la registry formal la
  completa WU-REG, coordinator-only).

### 2.2 Archivo creado

**`.agents/skills/sandbox-runtime-policy/SKILL.md`** (NEW, commit normal) — skill instalada con
contrato `copy-tree-no-mods` (familia `projectctl-requirements`): SKILL.md autónomo, sin
modificaciones posteriores sin bumpear `metadata.version`. Contenido:

- Frontmatter estándar: `name: sandbox-runtime-policy`; `description` con trigger (sandbox
  runtime, docker CLI, docker.sock, projectctl runtime control, no-docker, PTY);
  `metadata.id: sandbox-runtime-policy`; `metadata.version: 1.0.0` (inicial); `layer: repo`;
  `type: standard`; `sot_policy: canonical-standard`; `install: copy-tree-no-mods`;
  `metadata.categories: [sdd]`; `license: MIT`.
- Secciones de reglas operativas:
  - **Regla no-docker (dura)**: sandbox NO expone `docker` CLI ni `docker.sock`; `docker
    compose ...` dentro del sandbox MUST fallar (`docker: command not found` es comportamiento
    correcto, NO bug — PCT-99); prohibido recuperarlo vía sockets ad-hoc, `sudo`, bind mounts
    de `/var/run/docker.sock` o binarios embebidos; única superficie privilegiada =
    `webhook-listener` en el host.
  - **Regla projectctl-only (control exclusivo de runtime)**: control exclusivo vía
    `projectctl` — `env *` (status/get/set/unset/edit/validate/pull/run), `tunnel *`
    (status/tokens/routes/set-domain/set prod|dev/clear) y
    `start|stop|restart|rebuild|promote|deploy|doctor`; la PTY hospeda el binario y la API
    valida auth + ownership; estado canónico prod/dev inyectado de forma efímera.
  - **Escalación al coordinador**: operación de runtime no resoluble vía `projectctl` → escalar
    al coordinador (con comando intentado + error); validación runtime (env validate/status/
    doctor) es coordinator-owned en verificación; ante duda aplicar `projectctl-requirements`.

---

## 3. Verificación (file inspection, narrow — permitida)

| Check | Resultado | Evidencia |
| --- | --- | --- |
| SKILL.md existe | PASS | `.agents/skills/sandbox-runtime-policy/SKILL.md` (3260 bytes, NEW). |
| Declara reglas no-docker | PASS | "El sandbox NO expone `docker` CLI ni `docker.sock`" + "`docker compose ...` MUST fallar (`docker: command not found` es comportamiento correcto, NO un bug — PCT-99)" + "única superficie privilegiada ... `webhook-listener`". |
| Declara reglas projectctl-only | PASS | 14 menciones de `projectctl`; sección "Regla projectctl-only" con `env *`, `tunnel *`, `start|stop|restart|rebuild|promote|deploy|doctor`. |
| Ausencia de exposición docker | PASS | La skill declara la NO-exposición (no configura ni habilita acceso Docker); no hay paths/sockets/binarios de acceso. |
| Frontmatter estándar | PASS | `name: sandbox-runtime-policy`, `description` con trigger, `metadata.version: 1.0.0`, `metadata.categories: [sdd]`, `install: copy-tree-no-mods`. |
| (fase 3) `sot-coherence.test.ts` R-007 resuelve el path | DIFERIDO | REQ-TST-007/REQ-ENT-006 — gate de fase 3 (lane `sdd-apply-unit-tests` / `sdd-verify-units`); el test validará el path contra el repo. |
| (fase 3) `docs/00-context/agents_skills.md` (WU-CRS-2) y `.atl/skill-registry.md` (WU-REG) la listan | DIFERIDO | `agents_skills.md` ya la lista como prevista (WU-CRS-2 done); el registro formal la incorpora en WU-REG (coordinator-only, fase 4). |

---

## 4. Devueltos / entregables

- **Archivos modificados**: `.agents/skills/sandbox-runtime-policy/SKILL.md` (NEW, commit
  normal). **Nada más.**
- **Spec/design criteria satisfied**: REQ-ENT-006 (SKILL.md existe; sandbox sin docker
  CLI/socket; control exclusivo vía `projectctl`); PCT-99 (sandbox sin Docker; `projectctl`
  como control exclusivo; boundary `webhook-listener`); `standard.md` §4 (boundary seguro);
  AD-10 (orden de rollout: AC-001/entorno).
- **Task contract fields satisfied**: `code-low` — solo scope obligatorio (unit ID, apply_lane,
  owned files). Contract fields (spec linkage / implementation target / verify expects /
  routing) provistos por el coordinador y respetados en redacción y evidencia.
- **Deviations del diseño**: ninguna.
- **Unresolved follow-up**: la validación formal del path por `sot-coherence.test.ts` (R-007) y
  el registro en `.atl/skill-registry.md` (WU-REG) son de fase 3/4; fuera de authority de esta
  lane (no escribe tests, no ejecuta el registry refresh).

---

## 5. File-surface check (§D sdd-phase-common) — obligatorio

| Path | Clasificación |
| --- | --- |
| `.agents/skills/sandbox-runtime-policy/SKILL.md` | commit normal (trackeado/nuevo, bajo `.agents/skills/`). |
| `apply-WU-ENT-3.md` (este artifact) | commit normal (phase artifact bajo `taskReadme/`). |

Sin riesgos de delivery-surface: ningún archivo tocado es gitignored, generated ni local-only.
No se requirió `force-add`.

---

## 6. Rollback plan (no aplica cross-cutting de runtime)

Cambio aditivo de 1 archivo de skill (sin migraciones, sin overlays, sin Dockerfile, sin env).
Revertir es eliminar el archivo o revertir el merge del PR único (design §7.3). No hay
dependencia de rollback externo.

---

**criteria_covered**: AC-001
**next_recommended**: por AD-10, `sdd-apply-code-medium` WU-TST-1 (runner + gate + TEST_PLAN +
`.gitignore`, serial, último) — expect code-medium serial.
