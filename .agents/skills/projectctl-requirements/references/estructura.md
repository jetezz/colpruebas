---
file: references/estructura.md
parent_skill: projectctl-requirements
owner: WU-SKILL
purpose: contrato normativo de jerarquía de proyectos y mapping criteria type→carpeta
mapping_version: 1.0.0
profile: mis-proyectos
last_verified: 2026-09-20
sot_policy: canonical-standard
---

# Estructura estándar de proyecto y mapeo type→carpeta (mapping v1.0.0)

Esta referencia es la única SoT del layout top-level y del vínculo entre
`criteria[].type` y las carpetas del proyecto. Define navegación, ownership y
validación; la existencia de una carpeta o de un `evidence_path` no demuestra,
por sí sola, comportamiento funcional. La evidencia por método (`Unit`,
`PW-CLI`, `PW-AUTO`, `Manual`) sigue siendo obligatoria.

## Requisito: baseline de estructura 7+3

> **SoT original**: `taskReadme/20260919-pstruct-estructura-jerarquia-proyectos/spec.md` §2 AC-001 + `taskReadme/20260919-pstruct-estructura-jerarquia-proyectos/design.md` §File Changes.
> **Cumple**: AC-001.
> **last-verified**: 2026-09-19.

Cada carpeta existente debe tener un artefacto que la justifique y un owner
claro. Las siete carpetas núcleo son el baseline; las tres condicionales solo
se crean cuando su capacidad está presente. No se deben crear árboles vacíos.

| Carpeta núcleo | Owner | Contiene | No contiene |
|---|---|---|---|
| `frontend/` | Equipo frontend | Aplicación cliente, entrypoints, `src/`, `public/` y configuración del cliente. | API server, migraciones, secretos de producción ni scripts globales. |
| `backend/` | Equipo backend | API, jobs, workers y lógica de servidor. | Componentes visuales, Compose ni migraciones del CLI de Supabase. |
| `shared/` | Owners de frontend y backend | Contratos, schemas y clientes agnósticos de runtime. | Lógica exclusiva de un lado, secretos ni un cajón común. |
| `docs/` | Maintainers del proyecto | Arquitectura, contratos, decisiones, operación y onboarding. | Código ejecutable, snapshots ni secretos. |
| `tests/` | Quality / owners de cada superficie | Suites cross-component, integración, E2E y fixtures según la policy. | Código de producto ni seeds de producción. |
| `scripts/` | Developer experience | Automatización reproducible de desarrollo, validación y generación. | Lógica de negocio de runtime. |
| `deploy/` | Platform / release | CI/CD, manifests y configuración de entornos de entrega. | Código de aplicación, secretos reales ni configuración local efímera. |

| Carpeta condicional | Owner | Puede existir únicamente cuando |
|---|---|---|
| `supabase/` | Data / backend | Hay artefactos del CLI, como `config.toml`, migraciones, functions o seed. |
| `compose/` | Platform / runtime | Existe runtime local o CI gestionado por archivos Compose u overlays. |
| `.agents/` | Maintainers del proyecto | El proyecto utiliza skills o agentes específicos del repositorio. |

`capabilities` debe declarar `[frontend]`, `[backend]` o `[frontend, backend]`.
Una capacidad ausente vuelve inaplicables sus prefijos: no obliga a crear la
carpeta correspondiente. Un criterio que requiera una capacidad ausente debe
resultar `not-applicable` con `exception_reason: capability_absent`, o
`missing` si el contrato del proyecto lo exige explícitamente.

FSD puede vivir dentro de `frontend/` y la organización modular o hexagonal
puede vivir dentro de `backend/`; ninguna de esas jerarquías internas se eleva
a top-level. La elección de siete carpetas responde a ownership y navegación
predecibles en un proyecto fullstack ligero, sin imponer la fragmentación de
un monorepo (`apps/`, `packages/`, `services/`) cuando no existen despliegues
independientes. Tampoco convierte FSD o hexagonal en una taxonomía global:
son estrategias internas de cada superficie y siguen gobernadas por sus
skills respectivas.

## Requisito: mapping canónico de los nueve types

> **SoT original**: `taskReadme/20260919-pstruct-estructura-jerarquia-proyectos/spec.md` §2 AC-002 + `.agents/skills/projectctl-requirements/references/doc.md` §criteria[].
> **Cumple**: AC-002.
> **last-verified**: 2026-09-20.

Los paths son relativos a la raíz del proyecto y una carpeta incluye sus
descendientes. El enum App Map vigente de nueve valores permanece sin cambios; el enum PCT de siete valores y su mapping hacia este enum se documentan en las fuentes de criterios sin alterar este contrato.

| `type` | Carpeta primaria | Evidencia permitida | Verificación por defecto |
|---|---|---|---|
| `ui` | `frontend/src/views/`, `frontend/src/components/` | `frontend/src/features/`, `frontend/src/pages/`, `tests/e2e/` | `PW-CLI / PW-AUTO` |
| `functionality` | La capa de la regla: `frontend/src/` o `backend/src/` | `tests/e2e/`, `frontend/__tests__/`, `backend/**/__tests__/` | `PW-AUTO` |
| `a11y` | `frontend/src/views/`, `frontend/src/components/` | `tests/e2e/`, `tests/a11y/`, `docs/` para auditoría manual | `PW + Manual` |
| `backend` | `backend/src/` | `backend/**/__tests__/`, `tests/api/` | `Unit / API` |
| `data` | `supabase/migrations/` | `supabase/`, `backend/src/`, `tests/data/` | `Unit / SQL` |
| `integration` | `backend/src/integrations/` | `backend/src/`, `tests/integration/`, `docs/02-features/` | `Contract / API` |
| `security` | `backend/src/auth/`, `backend/src/middleware/` | `frontend/src/` solo para enforcement cliente, `tests/security/`, `docs/00-context/security.md` | `Unit / API + revisión` |
| `performance` | La carpeta de la superficie medida: `frontend/src/` o `backend/src/` | `tests/performance/`, `scripts/`, `docs/` para protocolo/resultado | `Suite perf / Manual` |
| `tooling` | `scripts/`, `.agents/` | `scripts/**/*.test.*`, `docs/04-process/` | `Unit + Manual` |

El campo aditivo opcional `evidence_paths: string[]` debe usar paths relativos
POSIX, sin `/` inicial, `..`, globs ambiguos ni escape de la raíz mediante
symlink. Para criterios `implemented` o `partial`, Gate exige al menos un
path, salvo excepciones normativas. `docs/` puede documentar protocolo o
resultado, pero nunca sustituye la prueba de implementación.

## Requisito: aliases de migración y diagnósticos

> **SoT original**: `taskReadme/20260919-pstruct-estructura-jerarquia-proyectos/spec.md` §2 AC-002/AC-004 + `taskReadme/20260919-pstruct-estructura-jerarquia-proyectos/design.md` §Interfaces / Contracts.
> **Cumple**: AC-002, AC-004.
> **last-verified**: 2026-09-19.

Los aliases se aceptan únicamente durante la migración y no pueden reutilizarse
para otro significado:

| Canónico | Alias de migración |
|---|---|
| `frontend/src/views/` | `apps/web/src/views/`, `src/views/` |
| `backend/src/` | `apps/api-bun/src/`, `api/src/` |
| `compose/` | `docker-compose*.yml` en la raíz |

Usar un alias emite `DEPRECATED_PATH`. Los criterios transversales deben
declarar un type primario y la unión permitida de paths, o dividirse por
preocupación. Cada diagnóstico incluye `criterion_id`, `type`, `path`,
`matched`, `reason`, `code` y `severity`.

Los ocho códigos estables son:

| Código | Regla |
|---|---|
| `TYPE_UNKNOWN` | El type no pertenece al enum de nueve valores. |
| `PATH_REQUIRED` | Falta `evidence_paths` cuando la fase lo exige. |
| `PATH_TRAVERSAL` | El path contiene traversal o intenta salir de la raíz. |
| `PATH_OUTSIDE_TYPE_ROOT` | El path no está contenido en un prefijo permitido. |
| `PATH_MISSING` | El path permitido no existe. |
| `TYPE_PATH_MISMATCH` | El path y la preocupación declarada no corresponden. |
| `DEPRECATED_PATH` | Se usó un alias de migración. |
| `MAPPING_VERSION_UNSUPPORTED` | La versión declarada no es conocida; no se infiere otra. |

## Requisito: rollout gradual warn→error

> **SoT original**: `taskReadme/20260919-pstruct-estructura-jerarquia-proyectos/spec.md` §2 AC-004 + `taskReadme/20260919-pstruct-estructura-jerarquia-proyectos/design.md` §Migration / Rollout.
> **Cumple**: AC-004.
> **last-verified**: 2026-09-19.

La adopción sigue cinco fases ordenadas, sin big-bang:

1. **Observación:** informar divergencias, duplicados y aliases sin bloquear.
2. **Normalización:** publicar el mapping v1.0.0, aceptar `evidence_paths`
   opcional, corregir criterios activos y preparar aliases.
3. **Advertencia:** paths faltantes y aliases son warnings; traversal, escape
   de raíz y versión desconocida son bloqueantes.
4. **Gate:** exigir paths para criterios nuevos `implemented`/`partial` y
   después para todos los criterios aplicables.
5. **Retiro:** eliminar aliases solo con reporte sin usos y una versión MAJOR;
   declarar `introduced_in`, `deprecated_in`, `remove_after` y `replacement`.

En la fase inicial del validador todos los diagnósticos se observan como
warnings sin mutar archivos ni crear carpetas; el contrato de seguridad no
permite silenciar traversal, escape de raíz o versiones desconocidas.

## Requisito: SemVer independiente

> **SoT original**: `taskReadme/20260919-pstruct-estructura-jerarquia-proyectos/spec.md` §2 AC-005 + `.agents/skills/projectctl-requirements/references/maintenance.md` §5.
> **Cumple**: AC-005.
> **last-verified**: 2026-09-19.

La tabla y la skill versionan explícitamente el contrato y son independientes
del App Map generado:

| Cambio | Versión |
|---|---|
| Corrección del validador, documentación no contractual o diagnóstico sin cambiar semántica ni paths aceptados | **PATCH** |
| Nuevo type, prefijo o carpeta compatible que amplía sin invalidar paths; publicación inicial compatible | **MINOR** |
| Eliminación/renombrado sin alias, prefijo más estrecho, cambio semántico de type, retiro de alias o campo obligatorio para entradas existentes | **MAJOR** |

Cada cambio de type o carpeta actualiza el manifest único, fixtures válidos e
inválidos, documentación, aliases y plan de migración antes del hard gate. La
publicación de este contrato incrementa la skill de `12.0.0` a `12.1.0`; el
cambio contractual posterior de tabs y secciones publica `13.0.0`; no modifica
el binding de tareas `v10.0.0`. El árbol se distribuye completo con
`copy-tree-no-mods`: un consumidor reemplaza la copia anterior, no mezcla
versiones.

## Referencias relacionadas

- `references/doc.md` — contrato de criterios y tab Doc; esta referencia no lo duplica.
- `references/maintenance.md` — anti-drift, `last-verified` y SemVer cross-repo.
- `.agents/skills/skill-creator/SKILL.md` — frontera entre policy local y skills relacionadas.
- `taskReadme/20260919-pstruct-estructura-jerarquia-proyectos/spec.md` — requisitos y escenarios de la task.
