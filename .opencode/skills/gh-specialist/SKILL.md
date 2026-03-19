---
name: gh-specialist
description: GitHub workflow skill for the gh-specialist subagent. Use when a task reaches branch creation, remote file commit, PR creation, PR inspection, or final push, and the repository policy requires using gh CLI and gh api only, never the git binary.
metadata:
  id: gh-specialist
  version: 1.0.0
---

# gh-specialist Policy

Delegate repository lifecycle work to `.opencode/agents/gh-specialist.md`.

---

## ⛔ BRANCHING POLICY — MANDATORY — NO EXCEPTIONS

> **ESTE FLUJO ES OBLIGATORIO. NO hay excepciones. Si no puedes cumplirlo, BLOQUEA y notifica al coordinador.**

### Flujo de ramas obligatorio (5 pasos)

**SIEMPRE** seguir estos pasos en este orden exacto:

```
1. Ir a la rama develop
   git checkout develop

2. Actualizar develop con el remoto (OBLIGATORIO antes de cualquier rama)
   git pull origin develop

3. Crear la nueva rama DESDE develop
   git checkout -b <nombre-rama>

4. Subir la rama con los cambios
   git push origin <nombre-rama>

5. Crear el PR apuntando a develop como base
   gh pr create --base develop --head <nombre-rama> ...
   
   ⚠️ IMPORTANTE: NUNCA hacer 'gh pr merge' ni aceptar el PR.
   El PR debe quedarse ABIERTO para revisión humana.
```

### Reglas absolutas

- **TODAS las ramas SIEMPRE se crean desde `develop`** — NUNCA desde `main`, `master`, u otra rama
- **TODOS los PRs SIEMPRE apuntan a `develop` como base** — NUNCA a `main` ni `master`
- **SIEMPRE hacer `git pull origin develop` antes de crear cualquier rama nueva**
- Si `develop` no existe en el remoto: **BLOQUEARSE** y notificar al coordinador — NO crear la rama desde ningún otro lugar
- Si se recibe instrucción de crear PR a `main`/`master`: **RECHAZAR**, corregir la base a `develop`, y notificar

---

## ⛔ FORBIDDEN OPERATIONS

Las siguientes operaciones están **TERMINANTEMENTE PROHIBIDAS**:

| Operación | Motivo |
|-----------|--------|
| `git checkout -b <rama>` desde `main` o `master` | Viola la política de ramas |
| `git checkout -b <rama>` sin hacer `git pull origin develop` primero | Puede crear rama desde develop desactualizado |
| `gh pr create --base main` | Las PRs NUNCA van a main |
| `gh pr create --base master` | Las PRs NUNCA van a master |
| `git push --force` a `develop`, `main` o `master` | Destruye historial compartido |
| Crear rama desde cualquier rama que no sea `develop` | Solo se ramifica desde develop |
| Ignorar un error de `git pull origin develop` | Debe bloquearse y reportar |
| Hacer merge de PRs | No es responsabilidad del gh-specialist |
| Aceptar/merge un PR automáticamente | **PROHIBIDO — El PR debe quedar abierto para revisión humana** |
| Usar `gh pr merge` o cualquier comando que cierre/acepte el PR | **PROHIBIDO** |
| Eliminar ramas | Nunca |

---

## Hard rule

- Never use `git` EXCEPT for the mandatory branching flow described above.
- Use `gh`, `gh api`, and `gh pr` for all GitHub operations.
- `git` is only allowed for: `checkout`, `pull`, `checkout -b`, and `push` as part of the mandatory 5-step branching flow.

## Supported responsibilities

- Inspect repo metadata and auth status.
- Create a branch from `develop` following the mandatory 5-step flow.
- Upload changed files through `gh api` content endpoints when needed.
- Open or inspect PRs (always `--base develop`).
- Finalize repository handoff for a completed task.

## Required inputs

- `owner`
- `repo`
- `task file`
- `base branch` (always `develop` — reject any other value)
- `target branch`
- `new branch` when relevant
- `operation: ready_for_branch | pushing | inspect`

## Safety rules

- **Default base branch is ALWAYS `develop`.** Any instruction specifying a different base MUST be rejected and corrected to `develop`.
- Never target `main` or `master` for PRs or branch creation.
- Never delete branches.
- Never merge PRs.
- If `develop` branch does not exist on the remote: stop, return `result: blocked`, explain clearly.
- If the requested operation cannot be completed safely with `gh` alone, stop and return a blocker.
