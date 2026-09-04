# APPLY-WU-TSK-2 — Evidencia de implementación (AC-004 TAREAS)

> Lane: `sdd-apply-code-low` · Unit: `WU-TSK-2` · apply_lane: `code-low`
> Objetivo: AC-004 — retirar estados del frontmatter de los 4 fixtures taskReadme a `status: done`
> (AD-04) sin mover a carpeta histórica ni borrar contenido.
> Estado de la unit: `done` · Archivo de evidencia: este artifact.
> Estándar inyectado: `projectctl-requirements` v10.0.0 / binding `task-flow-binding` v9.0.0.

---

## 1. Pre-implementation gate (code-low — scope-only)

| Gate | Resultado | Evidencia |
| --- | --- | --- |
| **Scope** | PASS | Unit `WU-TSK-2`, `apply_lane: code-low`, archivos owned exactos (4 fixtures). Nada más tocado. |

Las restantes 4 filas del gate (Spec linkage / Implementation target / Verification target /
Failure routing) NO se exigen en `code-low`; son responsabilidad del coordinador al asignar la
unit (per `.agents/skills/sd-protocol/apply-work-unit-schema.md §5` y
`.agents/skills/sdd-apply-code/SKILL.md`).

---

## 2. Implementación (AD-04, REQ-TSK-003)

En cada uno de los 4 fixtures se modificaron SOLO dos líneas del frontmatter: el `status` retirado
→ `done` y `updated` al timestamp del apply (`2026-08-25T09:03:14.000Z`). NO se movieron a carpeta
histórica ni se borró contenido. `created`, `source_branch`, `target_branch`, `branch_name`,
`pr_url`, `error_message` y el cuerpo completo permanecen intactos.

| Archivo | `status` (antes → después) | `updated` (antes → después) |
| --- | --- | --- |
| `taskReadme/2026-04-17-test-task-for-state-branching.md` | `branching` → `done` | `2026-04-17T10:02:16.147Z` → `2026-08-25T09:03:14.000Z` |
| `taskReadme/2026-04-17-test-task-for-state-pushing.md` | `pushing` → `done` | `2026-04-17T10:02:16.186Z` → `2026-08-25T09:03:14.000Z` |
| `taskReadme/2026-04-17-test-task-for-state-ready-for-branch.md` | `ready_for_branch` → `done` | `2026-04-17T10:02:16.127Z` → `2026-08-25T09:03:14.000Z` |
| `taskReadme/2026-04-17-test-task-for-state-verified.md` | `verified` → `done` | `2026-04-17T10:02:16.259Z` → `2026-08-25T09:03:14.000Z` |

### Verificación narrow (implementation-local)

- `grep -rn '^status: \(branching\|pushing\|ready_for_branch\|verified\)' taskReadme/*.md`:
  **0 ocurrencias** (exit=1) — ninguno de los 4 estados retirados queda como `status`.
- Los 4 archivos existen con frontmatter `status: done` y **55 líneas** cada uno (contenido
  preservado en su totalidad; solo cambiaron `status` + `updated`).

---

## 3. Criterios / tasks contract

- `criteria_covered`: **AC-004**
- Spec scenarios satisfechos: REQ-TSK-003 (frontmatter con estado válido del `status.writable`;
  archivo conservado como historial; escaneo sin `branching/pushing/ready_for_branch/verified` como status).
- Deviations: NONE.
- Unresolved follow-up: NONE.

---

## 4. Delivery-surface risk check

- **Force-add required**: NONE. Los 4 archivos están bajo `taskReadme/` (superficie de commit normal
  del repo, no gitignored).
- **Exclude from commit**: NONE.
- **Policy review required**: NONE.

---

**criteria_covered**: AC-004
**next_recommended**: WU-CRS-1 (`sdd-apply-code-medium`) — tarea crítica de completion para la
tab Tareas (`Completing/To Complete`) en frontend.
