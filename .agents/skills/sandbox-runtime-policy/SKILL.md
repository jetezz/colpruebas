---
name: sandbox-runtime-policy
description: "Trigger: sandbox runtime, docker CLI, docker.sock, projectctl runtime control, no-docker, PTY. Preserve the sandbox runtime contract: no Docker exposure and exclusive runtime control via projectctl."
metadata:
  id: sandbox-runtime-policy
  version: 1.0.0
  layer: repo
  type: standard
  sot_policy: canonical-standard
  install: copy-tree-no-mods
  categories:
    - sdd
license: MIT
---

# Sandbox Runtime Policy

Policy repo-local que preserva el **contrato de runtime del sandbox**: el sandbox NO expone
Docker y el control del runtime de los proyectos gestionados se realiza **exclusivamente** vía
`projectctl`. Es la SoT citada por `projectctl-requirements` (`references/entorno.md` PCT-99)
y por la regla sandbox de `references/standard.md` §4.

## Regla no-docker (dura)

- El sandbox NO expone `docker` CLI ni `docker.sock`.
- Cualquier intento de ejecutar `docker` / `docker compose ...` desde dentro del sandbox MUST
  fallar (`docker: command not found` es comportamiento **correcto**, NO un bug — PCT-99).
- No intentar recuperar Docker vía paths alternativos, sockets ad-hoc, `sudo`, bind mounts de
  `/var/run/docker.sock` ni binarios embebidos. Esa superficie no existe por diseño.
- La **única** superficie privilegiada que ejecuta Docker Compose es `webhook-listener` en el
  host (boundary `terminal -> projectctl -> API -> webhook-listener -> Docker host`).

## Regla projectctl-only (control exclusivo de runtime)

- Desde el sandbox, el runtime se controla **exclusivamente** vía `projectctl` (la PTY del
  proyecto hospeda el binario; la API valida auth + ownership):
  - `projectctl env *` — gestión de `.env` / `.env.dev` (`status`, `get`, `set`, `unset`,
    `edit`, `validate`, `pull`, `run`).
  - `projectctl tunnel *` — tunnel compartido (`status`, `tokens`, `routes`, `set-domain`,
    `set prod|dev`, `clear`).
  - `projectctl start|stop|restart|rebuild|promote|deploy|doctor` — ciclo de vida del runtime
    (dev y prod) y diagnóstico.
- Si necesitás runtime desde la terminal, la vía soportada es `projectctl`. No usar comandos
  raw que asuman Docker disponible en el sandbox.
- El estado canónico de configuración `prod/dev` se inyecta de forma efímera; no editar
  overlays ni env como atajo a un control de runtime.

## Escalación al coordinador

- Si una operación de runtime no puede resolverse vía `projectctl` (o el comando no existe /
  falla por permiso), **escalar al coordinador** con el comando intentado y el error observado.
  No reemplazar `projectctl` por Docker raw ni por herramientas de terceros.
- La validación del runtime (`projectctl env validate`, `status`, `doctor`) es
  coordinator-owned en fase de verificación; un lane de apply no la ejecuta ni la sustituye.
- Ante duda sobre si un cambio afecta el boundary sandbox o el runtime gestionado, aplicar
  `projectctl-requirements` (`references/entorno.md` + `references/standard.md`) y solo esta
  skill para el boundary interno del sandbox.

## Resultado esperado

- Sin exposición Docker en el sandbox (CLI ni socket).
- Control de runtime estable, auditable y exclusivo vía `projectctl`.
- Escalación correcta al coordinador ante cualquier necesidad fuera del contrato.
