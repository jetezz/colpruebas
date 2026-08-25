# Agent Skills — Registro de skills del repo colpruebas

> Fuente de lectura de las skills instaladas en este repo, coherente con el inventario
> `.atl/skill-registry.md` (SoT del registro). La regeneración formal del registro la ejecuta
> el coordinador (`gentle-ai skill-registry refresh --force`, coordinator-only).

## Propósito

Este documento describe las **skills instaladas en el repo** `colpruebas`. Es parte de los
prerrequisitos cross de compatibilidad `/projectctl` y se mantiene alineado con
`.atl/skill-registry.md`: ambos nombran el mismo conjunto de skills project-installed.

## Skills instaladas (project)

El generador canónico excluye del índice las workflow skills `sdd-*` (son lanes del binding,
resolubles en disco vía `.agents/skills/<skill>/SKILL.md`, no forman parte del registro de
selección delegator). Las skills project-installed de este repo son:

| Skill | Trigger / descripción |
| --- | --- |
| `coordinador` | Trigger: coordinator, orchestrator, SDD task flow. Resuelve y aplica un `WorkflowRuntimeContextV1` validado desde el locator/binding antes de rutear o transicionar. |
| `engram-policy` | Trigger: Engram, memory, taskReadme recovery, resume. Aplica las reglas de persistencia y recall repo-local. |
| `judgment-day` | Trigger: judgment-day, dual review, adversarial review. Mecanismo de review opt-in con doble juez ciego. |
| `projectctl-requirements` | Trigger: projectctl rules, project onboarding, requirements checklist, docs governance, testing policy, runtime policy, task flow, projectctl operation. Estándar cross-repo de compatibilidad `/projectctl` (`cli \| doc \| test \| entorno \| tareas`). |
| `sandbox-runtime-policy` | Trigger: sandbox runtime, docker CLI, docker.sock, projectctl runtime control, no-docker, PTY. Preserva el contrato de runtime del sandbox: NO expone docker CLI/socket y el control de runtime es exclusivo vía `projectctl` (PCT-99). |
| `sd-protocol` | Trigger: sd-protocol, sdd phase common, skill resolver, persistence contract, workflow runtime context. Librería de mecanismos universales de protocolo SDD. |

## Coherencia con `.atl/skill-registry.md`

El inventario máquina de skills project-installed vive en `.atl/skill-registry.md` (formato
emitido por el generador, con `Scope: project` y path absoluto bajo `REPO_ROOT/.agents/skills/`).
Este documento es la lectura legible del mismo conjunto; cualquier nueva skill instalada debe
reflejarse en ambos, siendo el archivo generado la fuente canónica.

## Skills por superficie (resumen)

- **Runtime**: `projectctl-requirements`, `sandbox-runtime-policy` — control vía
  `projectctl`, docs funcionales, testing y flujo de tareas.
- **Coordinación**: `coordinador`, `sd-protocol`, `engram-policy` — contexto de workflow y
  persistencia SDD.
- **Review**: `judgment-day` — revisión adversarial opt-in.

Ver `AGENTS.md` y `docs/04-process/task.md` para el flujo operativo.
