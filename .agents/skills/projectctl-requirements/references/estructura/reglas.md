---
file: references/estructura/reglas.md
parent_skill: projectctl-requirements
owner: WU-SKILL
purpose: contrato normativo de jerarquía de proyectos y mapping criteria type→carpeta
mapping_version: 1.0.0
last-verified: 2026-09-28
sot_policy: canonical-standard
---

# Estructura — reglas (mapping v1.0.0)

Única SoT del layout top-level y del vínculo entre `criteria[].type` y las
carpetas del proyecto tras el split por secciones. Define navegación,
ownership y validación; la existencia de una carpeta o de un `evidence_path`
no demuestra, por sí sola, comportamiento funcional. La evidencia por método
(`Unit`, `PW-CLI`, `PW-AUTO`, `Manual`) sigue siendo obligatoria.

> **Contratos machine residentes**: `references/app-map/` y
> `references/schemas/` NO se mueven: son contratos machine residentes y aquí
> solo se citan. La convención de markers de código (`@criterion`, `@trace`)
> y el layout de trazabilidad front/back viven en
> `references/code/reglas.md`, no aquí.

## Ruta de verificación: criterios → docs → test → estructura → code

El proyecto gestionado toma **identidad** de `criteria[]` inline en los
bundles `docs/app-map/` listados en `navigation.yaml`, no de una tabla de
prosa, los criterios de muestra incluidos en la skill ni un marker de código.
Un criterio activo (`functional: implemented|partial`) necesita
`evidence_paths` en **su item de frontmatter**, paths existentes y permitidos
para su `type`. Un listado en el body del bundle o `evidencePaths` en una
 card frontend no es ese campo. Los tests enlazan los IDs mediante `@ac` (contrato operativo en `references/test/reglas.md`); los locators de código `@criterion`/`@trace`/`@contract` se rigen por `references/code/reglas.md` y nunca prueban funcionalidad por sí solos. Los criterios sin capacidad aplicable se declaran
`not-applicable` + `exception_reason: capability_absent`, sin fabricar
carpetas. Los `AC-001..AC-005` citados como origen de la task de jerarquía
son IDs de aquella task, **no** sustituyen los `AC-001..` del bundle propio
de un proyecto destino aunque coincidan lexicalmente.

**Doctor del checkout, solo lectura**:

```bash
bun .agents/skills/projectctl-requirements/scripts/project/doctor-structure.ts --root . --json
```

Compara la matriz de nueve tipos de esta referencia con criterios, bundles,
headers `@ac`, rutas de evidencia y markers canónicos de código; reporta
`red`/exit 1 si se rompe un eslabón, `unverified`/exit 3 si falta prueba
estricta/remota. No modifica carpetas, criterios, tests ni snapshots. En la
opción `--target=<view>[:<feature>]` evalúa los criterios del subárbol seleccionado
con el inventario compartido de App Map, preservando mapping y carpetas comunes
como comprobaciones globales. Sin filtro mantiene la cadena del proyecto entero. En la
PTY autenticada se puede añadir `--managed` para consultar
`projectctl structure check --mapping 1.0.0 --json`; **no** interpretar su
`exit 0` como sincronía probada si contiene warnings `PATH_REQUIRED`,
aliases o un manifest de trazabilidad copiado de otra instancia. Contrastar
la lectura del app-map con el doctor Doc y la cobertura con el doctor Test;
los checks locales no reemplazan su parser estricto ni las suites reales.

## Requisito: baseline de estructura 7+3

> **SoT original**: esta referencia de mapping v1.0.0 + `scripts/project/doctor-structure.ts` y `scripts/__tests__/doctor-structure.test.ts` (distribuidos). La task de jerarquía de la instancia es historial no instalado en destinos.
> **Cumple**: AC-001.
> **last-verified**: 2026-09-29.

Cada carpeta existente debe tener un artefacto que la justifique y un owner
claro. Las siete carpetas núcleo son el baseline fullstack; en frontend-only
`backend/` es inaplicable (quedan seis núcleo pertinentes). Las tres
condicionales solo se crean cuando su capacidad está presente. No se deben
crear árboles vacíos.

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

`capabilities` debe declarar `[frontend]`, `[backend]` o
`[frontend, backend]`. Una capacidad ausente vuelve inaplicables sus
prefijos: no obliga a crear la carpeta correspondiente. Un criterio que
requiera una capacidad ausente debe resultar `not-applicable` con
`exception_reason: capability_absent`, o `missing` si el contrato del
proyecto lo exige explícitamente. Estas `capabilities`
([frontend]/[backend]) son capacidades de proyecto y no deben confundirse con
las capacidades de runtime del manifest (`core`/`web-browser`/`managed-docker`,
validadas fuera del paquete). El operador infiere capacidad del directorio
`frontend/`/`backend/` en su snapshot; una carpeta vacía `api/` legacy no
debe contar como backend. Root `compose.yml` + overlays son un contrato
válido del operador sin crear un `compose/` vacío por cumplir la estructura.
El doctor local informa inferencia de capacidades, no la equipara con una
declaración verificable.

## Requisito: mapping canónico de los nueve types (mapping v1.0.0)

> **SoT original**: esta tabla v1.0.0 + `.agents/skills/projectctl-requirements/references/docs/reglas.md` §criteria[] y `scripts/project/doctor-structure.ts` (distribuidos).
> **Cumple**: AC-002.
> **last-verified**: 2026-09-22.

Los paths son relativos a la raíz del proyecto y una carpeta incluye sus
descendientes. El enum vigente es el App Map de nueve valores y permanece sin
cambios; los siete valores PCT históricos son solo alias de migración
(`behavior→functionality`, `contract→backend`, `tooling→tooling`,
`visual→ui`, `a11y→a11y`, `operational→integration`, `docs→tooling`)
documentados en las fuentes de criterios, sin validez como enum cerrado ni
alteración de este contrato.

| `type` | Carpeta primaria | Evidencia permitida | Verificación por defecto |
|---|---|---|---|
| `ui` | `frontend/src/views/`, `frontend/src/components/` | `frontend/src/features/`, `frontend/src/pages/`, `tests/e2e/` | `PW-CLI / PW-AUTO` |
| `functionality` | La capa de la regla: `frontend/src/` o `backend/src/` | `tests/e2e/`, suites unit de la instancia destino | `PW-AUTO` |
| `a11y` | `frontend/src/views/`, `frontend/src/components/` | `tests/e2e/`, `tests/a11y/`, `docs/` para auditoría manual | `PW + Manual` |
| `backend` | `backend/src/` | `backend/**/__tests__/`, `tests/api/` | `Unit / API` |
| `data` | `supabase/migrations/` | `supabase/`, `backend/src/`, `tests/data/` | `Unit / SQL` |
| `integration` | `backend/src/integrations/` | `backend/src/`, `tests/integration/`, `docs/02-features/` | `Contract / API` |
| `security` | `backend/src/auth/`, `backend/src/middleware/` | `frontend/src/` solo para enforcement cliente, `tests/security/`, `docs/00-context/security.md` | `Unit / API + revisión` |
| `performance` | La carpeta de la superficie medida: `frontend/src/` o `backend/src/` | `tests/performance/`, `scripts/`, `docs/` para protocolo/resultado | `Suite perf / Manual` |
| `tooling` | `scripts/`, `.agents/` | `scripts/**/*.test.*`, `docs/04-process/` | `Unit + Manual` |

El campo aditivo opcional `evidence_paths: string[]` debe usar paths
relativos POSIX, sin `/` inicial, `..`, globs ambiguos ni escape de la raíz
mediante symlink. Para criterios `implemented` o `partial`, Gate exige al
menos un path, salvo excepciones normativas. `docs/` puede documentar
protocolo o resultado, pero nunca sustituye la prueba de implementación. El
parser real del snapshot (wrapper local de la instancia destino, no portable)
`readStructureRoot` lee este campo **solo** de `criteria[]` en frontmatter.
El validador `checkStructure` de la plataforma está en modo `policyMode:
warning`; `PATH_REQUIRED`/`PATH_MISSING`/`DEPRECATED_PATH` son warnings y
pueden convivir con `success: true`. El doctor de sincronía considera un path
activo ausente un bloqueo de readiness **local**, sin cambiar la severidad ni
el rollout del operador. `shared/` aloja contratos, no se convierte por su
existencia en raíz de implementación `ui`, `backend` o `tooling`.

## Requisito: aliases de migración y diagnósticos

> **SoT original**: esta tabla de aliases + `scripts/project/doctor-structure.ts`; la task de jerarquía de la instancia es historial no distribuido.
> **Cumple**: AC-002, AC-004.
> **last-verified**: 2026-09-19.

Los aliases se aceptan únicamente durante la migración y no pueden
reutilizarse para otro significado:

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

> **SoT original**: esta referencia y `scripts/project/doctor-structure.ts` (modo local); el rollout de la instancia es historial no distribuido.
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

> **SoT original**: esta tabla de versionado + `.agents/skills/projectctl-requirements/references/maintenance.md` (historial distribuido).
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
inválidos, documentación, aliases y plan de migración antes del hard gate. El
historial de publicación vive en `references/maintenance.md`. El binding
de tareas se versiona por separado en `projectctl-sdd`; este mapping no lo
modifica. El árbol se distribuye completo con `copy-tree-no-mods`: un
consumidor reemplaza la copia anterior, no mezcla versiones.

## Referencias relacionadas

- `references/docs/reglas.md` — contrato de criterios y tab Doc; esta referencia no lo duplica.
- `references/maintenance.md` — anti-drift, `last-verified` y SemVer cross-repo.
- Principio interno portable (propósito canónico declarado en `.agents/skills/projectctl-requirements/SKILL.md`, sin depender de skill externa) — frontera entre policy local y skills relacionadas.
- La task de origen es historial de instancia, no dependencia del paquete core.
