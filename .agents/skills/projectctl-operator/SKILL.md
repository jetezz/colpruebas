---
name: projectctl-operator
description: "Trigger: projectctl, dev/prod runtime, managed project terminal. Inspect and operate project runtime safely."
license: MIT
metadata:
  id: projectctl-operator
  version: 1.0.0
---

# Projectctl Operator

Usá esta skill cuando necesites operar entornos gestionados desde la terminal del proyecto abierta en OpenCode.

## Qué es `projectctl`

`projectctl` es el CLI terminal-first y project-scoped para inspeccionar y operar el runtime gestionado del proyecto actual.

- corre dentro de la PTY del proyecto
- habla con el backend autenticado del repo
- NO da acceso raw a Docker dentro de `sandbox`
- sirve para `dev` y `prod` sin salir del workspace

## Boundary y arquitectura

```text
terminal -> projectctl -> API -> webhook-listener -> Docker host
```

- `sandbox` hospeda la terminal y el binario `projectctl`
- la API valida auth + ownership del proyecto
- `webhook-listener` es la única superficie privilegiada que ejecuta Docker Compose
- NO usar `docker ps`, `docker compose ...` ni acceso al daemon desde `sandbox`

Si necesitás runtime desde la terminal, la vía soportada es `projectctl`.

## Cuándo usarlo

Usalo para:

- ver estado `prod` / `dev`
- listar contenedores del proyecto actual
- leer logs por entorno o servicio
- arrancar / frenar / reiniciar `dev`
- promover `prod`
- inspeccionar releases auditadas, diffearlas y hacer rollback seguro
- diagnosticar config, drift, reachability y tunnel

No lo uses para:

- operar otros proyectos
- ejecutar Docker arbitrario
- administrar imágenes/redes/volúmenes del host

## Command reference

### `projectctl help`

Muestra comandos soportados, flags y recuerda que el scope es solo el proyecto actual.

### `projectctl status`

Muestra resumen de `prod` y `dev`.

- imprime bloques `=== PROD ===` y `=== DEV ===`
- incluye compose project, running/stopped, containers, ports, URLs y errores

### `projectctl ps`

Lista contenedores de ambos entornos del proyecto actual.

- imprime `=== CONTAINERS: PROD ===` y/o `=== CONTAINERS: DEV ===`
- si no hay nada, muestra `(no containers running)`

### `projectctl ps dev`

Lista solo contenedores `dev`.

### `projectctl ps prod`

Lista solo contenedores `prod`.

### `projectctl logs dev`

Muestra logs de `dev` para todos los servicios.

- `--tail` default: `50`
- sin logs puede devolver mensaje terminal-friendly en vez de stacktrace

### `projectctl logs prod`

Muestra logs de `prod` para todos los servicios.

### `projectctl logs dev <service> --tail 200`

Muestra las últimas `200` líneas del servicio indicado en `dev`.

Útil para revisar `frontend`, `api` o cualquier servicio permitido del compose project del proyecto.

### `projectctl logs dev <service> --since 10m`

Filtra logs desde la ventana temporal dada, por ejemplo `10m` o `2h`.

### `projectctl logs dev <service> --follow`

Sigue logs del servicio con pseudo-streaming por polling.

- se corta con `Ctrl-C`
- `Ctrl-C` detiene el follow, NO mata la PTY persistente

### `projectctl start dev`

Arranca el entorno `dev` del proyecto actual.

### `projectctl stop dev`

Detiene el entorno `dev` del proyecto actual.

### `projectctl restart dev`

Reinicia todo `dev` para el proyecto actual.

### `projectctl restart dev <service>`

Reinicia solo el servicio pedido dentro de `dev`.

- el servicio debe pertenecer al compose project resuelto
- servicios ajenos deben ser rechazados por backend/webhook

### `projectctl rebuild dev`

Reconstruye/recrea `dev`.

- es una operación de `dev`
- no usarla como sustituto de `promote prod`

### `projectctl deploy prod`

Alias operativo de `projectctl promote prod`.

- reutiliza la semántica existente de promote
- no crea un segundo flujo distinto de deploy

### `projectctl promote prod`

Promueve `prod` usando el flujo soportado por el repo.

### `projectctl run dev -- <command>`

Ejecuta un comando arbitrario en el workspace del sandbox, acotado por seguridad.

**Sintaxis**: `projectctl run dev -- <cmd> [args...]`

**Requerimientos**:
- `--` es obligatorio antes del comando (sin él se rechaza antes de ejecutar)
- Solo entorno `dev` — `run prod` no está soportado
- El comando debe estar en el allowlist de herramientas seguras

**Límites operativos**:

| Parámetro | Valor |
| --- | --- |
| Timeout | 30s (SIGKILL al expirar) |
| Output | 64KB combinado stdout+stderr retenido en vuelo |
| Alcance | `dev` solo |

**Allowlist**: `bun`, `node`, `npm`, `pnpm`, `bunx`, `npx`, `git`, `grep`, `ls`, `cat`, `ps`, `kill`, `pwd`, `head`, `tail`, `wc`, `sort`, `uniq`, `find`, `xargs`, `tee`, `mkdir`, `rm`, `cp`, `mv`, `chmod`, `echo`, `true`, `false`

**Ejemplos**:

```bash
# Ejecutar tests en dev
projectctl run dev -- bun test

# Ver contenido de archivos
projectctl run dev -- cat package.json

# Diagnóstico de proceso
projectctl run dev -- ps aux | grep node

# Git status
projectctl run dev -- git status
```

**Seguridad**:
- `spawn(cmd, args, { shell: false })` — sin shell, sin path injection
- Validación de allowlist antes de cada spawn
- La CLI SIEMPRE intenta persistir auditoría `run_dev` / `command`, pero hoy la persistencia es **best-effort**: si el endpoint de audit falla, el comando igual devuelve su resultado y el evento puede no aparecer en `projectctl activity`
- El sandbox no tiene acceso a Docker socket ni al daemon del host

**Qué NO es**:
- No es SSH a prod ni acceso a contenedores runtime
- No corre contra el runtime de Docker del host
- No hay versión prod por ahora (Option C blocked por threat-model ausente)

### `projectctl doctor`

Muestra diagnóstico accionable del proyecto.

Incluye, según disponibilidad:

- compose files detectados
- puertos configurados y efectivos
- estado de tunnel
- runtime drift
- último error operativo
- reachability
- **suggestions accionables** con comandos concretos para resolver problemas

### `projectctl version`

Muestra la versión del CLI (`2.0.0`). Funciona sin token ni proyecto.

- `projectctl version` — salida texto: `projectctl 2.0.0`
- `projectctl version --json` — salida JSON: `{"version": "2.0.0"}`
- `projectctl --version` / `projectctl -v` — shortcut equivalente

No requiere API token. Diseñado para scripts CI/CD y diagnóstico.

### `projectctl whoami`

Muestra contexto del usuario y proyecto actual sin filtrar secretos.

- `projectctl whoami` — salida texto con User, Project, Bridge
- `projectctl whoami --json` — `{"userId": "...", "projectId": "...", "bridgeStatus": "connected|missing"}`

**Security contract**: Nunca imprime `OPENCODE_API_TOKEN`, `token`, `apiToken` ni `API_TOKEN` en ningún output. El campo `bridgeStatus` indica `'connected'` si hay token disponible o `'missing'` si no lo hay.

Útil para diagnosticar la sesión actual en scripts y CI.

### `projectctl completion bash`

Genera script de completion bash. Sin dependencias externas.

```bash
projectctl completion bash > /tmp/projectctl-completion.bash
source /tmp/projectctl-completion.bash
```

O en `.bashrc`:

```bash
source <(projectctl completion bash)
```

### `projectctl completion zsh`

Genera script de completion zsh con `_arguments` style.

```bash
projectctl completion zsh > /tmp/projectctl-completion.zsh
source /tmp/projectctl-completion.zsh
```

O en `.zshrc`:

```bash
source <(projectctl completion zsh)
```

### `projectctl help [command|family]`

Muestra ayuda filtrada por familia o comando específico.

- `projectctl help` — ayuda completa de todos los comandos
- `projectctl help env` — solo comandos de la familia `env`
- `projectctl help tunnel` — solo comandos de la familia `tunnel`
- `projectctl help commands` — solo comandos de la familia `commands`
- `projectctl help tasks` — solo comandos de la familia `tasks`
- `projectctl help env get` — resuelve el comando exacto multi-palabra
- `projectctl help releases list` — resuelve el comando exacto integrado
- `projectctl help schedule` — solo comandos de la familia `schedule`
- `projectctl help unknownthing` — caeback a ayuda completa (sin error)

El subargumento puede ser nombre de familia (`env`, `tunnel`, `releases`, etc.) o comando completo (`env get`, `tunnel status`, `releases list`).

Con `--json` devuelve `{ "help": "..." }` sin ANSI.
## Releases y rollback

### `projectctl releases list`

Lista releases del proyecto actual, ordenadas de más nueva a más vieja.

- en humano imprime status, fecha, branch y commit corto
- con `--json` devuelve un array plano `Release[]`

### `projectctl releases show <id>`

Muestra el detalle de una release puntual.

- con `--json` devuelve un objeto plano `Release`
- `metadata_json` ya sale redactado desde la API

### `projectctl releases diff <from> <to>`

Compara metadata operativa entre dos releases del mismo proyecto.

- con `--json` devuelve `{ from, to, diff }`
- NO compara archivos arbitrarios ni expone secretos

### `projectctl rollback prod <id> --yes`

Hace rollback seguro de `prod` a una release previa.

- `--yes` es OBLIGATORIO en modo no interactivo
- sin `--yes` falla localmente con `CONFIRMATION_REQUIRED` y NO llama la API
- si la auditoría del rollback no se puede persistir, la operación falla con error accionable; no hay rollback “exitoso pero sin registro” en el contrato actual

## Metrics

### `projectctl metrics *`

Métricas operativas agrupadas por dominio. Diseñado para diagnostics sin leer logs manualmente.

- `projectctl metrics runtime [dev|prod]` — estado de contenedores, restart count, running/stopped. Cuando el probe no está disponible, devuelve `availability: unavailable` sin fallar todo el reporte.
- `projectctl metrics resources [dev|prod]` — CPU y memoria. Si el host probe no está disponible, el grupo `resources` devuelve `availability: unavailable` con mensaje accionable.
- `projectctl metrics errors [dev|prod]` — hoy expone explícitamente que la métrica de errores no está disponible todavía. Devuelve `availability: unavailable` sin stacktrace y no promete filtrado real por `--since`.

**Modelo de disponibilidad**: cada grupo (`runtime`, `resources`, `errors`) tiene su propio `availability` que puede ser `available | partial | unavailable`. Cuando una fuente no existe, el grupo correspondiente responde `availability: unavailable` sin comprometer el resto del reporte. El campo `schemaVersion: "1.0"` está presente en todas las respuestas JSON para permitir versionado de contrato.

**Uso típico**:

```bash
# Diagnóstico rápido de dev
projectctl metrics runtime dev

# CPU y memoria de prod
projectctl metrics resources prod

# Disponibilidad actual de errores en dev
projectctl metrics errors dev

# Scriptable: JSON sin ANSI
projectctl metrics runtime prod --json
```

**Importante**: `metrics` no da acceso raw a Docker. Los datos vienen del API vía webhook-listener. Si una métrica no está disponible, el outputdice qué falta y qué hacer (ej: "no resource data available"). No hay stacktraces para métricas no implementadas.

## Additional families (Batch A+B, Phases 3-8)

### `projectctl env *`

Gestión de configuración `.env` / `.env.dev`:

- `projectctl env status` — estado de config dev y prod
- `projectctl env get dev|prod` — ver contenido (mostrar contenido en stdout con hint de redirect)
- `projectctl env set dev|prod KEY=value` — setear variable (formato OBLIGATORIO: `KEY=value`; sin `=` falla localmente sin llamar API)
- `projectctl env unset dev|prod KEY` — eliminar variable
- `projectctl env validate` — validar puertos y config
- `projectctl env edit dev|prod` — imprime contenido actual a stdout con hint de redirect; NO es interactivo ni usa stdin. Si necesitás cambiar el archivo, exportalo a un temporal para inspección y después aplicá cambios explícitos con `projectctl env set <env> KEY=value`. `projectctl env set <env> -` está rechazado de forma explícita y NO reemplaza stdin.

**Regla de seguridad**: `env set` sin `=` falla localmente y nunca llama a la API. `projectctl env set <env> -` también falla localmente. No hay replace por stdin en el contrato actual.

### `projectctl tunnel *`

Gestión de tunnel y Cloudflare:

- `projectctl tunnel status` — estado y publishability
  - con `--json` devuelve `{ schemaVersion: "1.0", success: true, tunnel, publishability, actionRequired }` sin ANSI ni secretos
  - en humano muestra acciones cuando un entorno no es publicable (alias/red edge faltante)
- `projectctl tunnel tokens` — listar tokens activos
- `projectctl tunnel routes` — rutas CF enriquecidas
- `projectctl tunnel set-domain <domain>` — setear dominio
- `projectctl tunnel set prod|dev <hostname>` — setear hostname por entorno
- `projectctl tunnel clear prod|dev|all --yes` — limpiar hostname(s)

### `projectctl commands *`

CRUD de quick commands:

- `projectctl commands list` — listar comandos
- `projectctl commands add --name <name> --cmd <command>` — crear
- `projectctl commands update <id> [--name N] [--cmd C]` — actualizar
- `projectctl commands delete <id> --yes` — eliminar
- `projectctl commands run <id-or-name>` — mostrar comando exacto (no exec in-shell)

### `projectctl tasks *`

Gestión de tareas del proyecto:

- `projectctl tasks list` — listar todas
- `projectctl tasks show <file>` — ver detalle
- `projectctl tasks create --title <title>` — crear tarea
- `projectctl tasks update <file> [--status S] [--title T]` — actualizar
- `projectctl tasks delete <file> --yes` — eliminar

### `projectctl schedule *`

Tareas programadas:

- `projectctl schedule list` — listar con próxima ejecución y estado
- `projectctl schedule add --branch <branch> --daily <HH:mm> --prompt <text>` — tarea diaria
- `projectctl schedule add --branch <branch> --once <YYYY-MM-DDTHH:mm> --prompt <text>` — tarea única
- `projectctl schedule update <id> [...]` — actualizar campos
- `projectctl schedule enable|disable <id>` — habilitar/deshabilitar
- `projectctl schedule delete <id> --yes` — eliminar

### `projectctl quality *`

- `projectctl quality status` — estado de quality y evidencia

### `projectctl docs *`

- `projectctl docs list` — listar docs/app-map
- `projectctl docs show <id-or-path>` — ver contenido de doc

### `projectctl storage *`

- `projectctl storage status` — uso de storage (project, home, cache)
- `projectctl storage clean --yes` — limpiar cache

### `projectctl activity *`

Audit trail project-scoped de acciones operativas ejecutadas por `projectctl` y/o UI.

- `projectctl activity list` — lista eventos paginados del proyecto actual
  - flags: `--json`, `--type`, `--env`, `--actor`, `--since`, `--limit N`, `--offset N`
  - `--type`: `runtime|env|tunnel|command|task|schedule|storage|credential`
  - `--env`: `dev|prod`
  - `--actor`: `user|scheduler|webhook-listener|system`
  - `--since`: ISO timestamp (eventos posteriores)
  - `--limit`: `1..200` (default `50`)
  - `--offset`: paginación (default `0`)
  - output: `{ items: [...], total, limit, offset }` con cada item包含 `id, action, actionType, outcome, actor, environment, targetId, targetType, payload, errorMessage, correlationId, createdAt`
- `projectctl activity show <eventId>` — detalle de un evento individual
  - flags: `--json`
  - `404` si el evento no existe o no pertenece al proyecto
  - `403` si el usuario no es owner del proyecto

**Filtros útiles**:

```bash
# segunda página de eventos de runtime
projectctl activity list --type runtime --limit 10 --offset 10 --json

# eventos en prod desde hace 24h
projectctl activity list --env prod --since "$(date -d '24 hours ago' -Iseconds)" --json

# un evento específico
projectctl activity show <uuid> --json
```

**Seguridad**: ownership verificado en cada query. Secrets nunca se almacenan: el backend redacta campos sensibles (`SECRET`, `PASSWORD`, `TOKEN`, `KEY`, `AUTH`, `CREDENTIAL`) antes de persistir.

**Graceful degradation**: si la tabla `audit_events` no existe aún (migration pendiente), el endpoint devuelve `items: []` en lugar de error, para no bloquear la CLI durante el rollout inicial.

### `projectctl open <target>`

Abre o imprime la URL de un destino del proyecto.

- `projectctl open dev` — URL del entorno dev
- `projectctl open prod` — URL del entorno prod
- `projectctl open dashboard` — path interno del proyecto (`/project/:id`)
- `--print` — forzar impresión de URL
- `--json` — salida `{ target, url, opened }` sin ANSI

**Comportamiento de scripting**: `--print` y `--json` son side-effect-free. Nunca intentan ejecutar `xdg-open`/`open`; solo resuelven e imprimen.

**Comportamiento headless**: si no hay navegador disponible (PTY headless), el modo interactivo imprime la URL y retorna `opened: false`. No falla si no puede abrir.

**Seguridad**: read-only; no acepta URLs arbitrarias. Targets válidos: `dev`, `prod`, `dashboard`. `docs` y `quality` quedan fuera hasta tener deep links contractuales reales.

## Flags útiles

- `--json` — salida machine-readable sin ANSI
- `--yes` — confirmar operaciones destructivas/sensitivas (OBLIGATORIO para `stop prod`, `promote prod`, `deploy prod` en modo no-interactivo; puede ir antes o después del comando)
- `--yes` — también obligatorio para `rollback prod` en modo no interactivo
- `--tail N` — últimas N líneas de log
- `--since DURATION` — logs desde ventana temporal
- `metrics errors` puede aceptar `--since`, pero hoy se informa explícitamente como ignorado hasta que exista una fuente segura de errores recientes.
- `--follow` — seguir logs en tiempo real
- `--quiet` — output minimal para scripting

## Example workflows

### 1. Inspect both envs

```bash
projectctl status
projectctl ps
```

Interpretación rápida:

- `=== PROD ===` / `=== DEV ===` → vista por entorno
- `✓ running` → runtime arriba
- `✗ stopped` → entorno detenido o sin runtime levantado

### 2. Read prod logs before touching prod

```bash
projectctl status prod
projectctl logs prod --tail 200
projectctl doctor
```

Primero mirá estado y logs; recién después evaluá `projectctl promote prod`.

### 2b. Auditar releases antes de rollback

```bash
projectctl releases list
projectctl releases show <release-id>
projectctl releases diff <from-id> <to-id>
projectctl rollback prod <release-id> --yes
```

Primero inspeccioná qué release querés revertir. No hagas rollback a ciegas, hermano.

### 3. Stop/start dev and re-check status

```bash
projectctl stop dev
projectctl status
projectctl start dev
projectctl ps dev
projectctl logs dev --tail 50
```

### 4. Diagnose a project with doctor

```bash
projectctl doctor
```

Si `doctor` marca config faltante o drift, resolvé eso antes de insistir con restart/rebuild.

## Common output and troubleshooting

### No runtime / no containers

Salida típica:

- `No runtime status available for this project`
- `=== CONTAINERS ===` + `(no containers running)`
- `No dev runtime containers found for this project.`

Interpretación: no hay runtime levantado para ese entorno, o todavía no existen contenedores asociados.

Qué hacer:

- revisar `projectctl status`
- para `dev`, probar `projectctl start dev`
- usar `projectctl doctor` para ver config y drift

### No logs yet

Salida típica:

- `No prod logs available yet.`
- `(no logs available)`

Interpretación: el entorno existe pero todavía no emitió logs relevantes, o la consulta quedó vacía.

### Missing env config

`doctor` puede sugerir:

- `No environment config found. Save .env or .env.dev from the Environments tab.`
- `Dev environment not configured. Save .env.dev to enable dev.`
- `Prod environment not configured. Save .env to enable prod.`

Interpretación: falta configuración guardada del proyecto; no es un problema para resolver con Docker raw.

### Docker command blocked in sandbox

Salida esperable:

```bash
docker ps
# bash: docker: command not found
```

Interpretación: ES CORRECTO. `sandbox` no expone Docker CLI ni `docker.sock`. Usá `projectctl`.

### Missing terminal API token

Salida típica:

- `Missing terminal API token. Reopen the project terminal so OpenCode can inject a short-lived authenticated API bridge.`

Interpretación: la PTY viva no recibió el bridge auth de sesión.

Qué hacer:

- reabrir la terminal desde `/project/:id`
- volver a correr `projectctl help` o `projectctl status`

## Prod vs dev semantics and safety

- `status`, `ps` y `doctor` son seguros para inspección en ambos entornos
- `logs prod` se usa para mirar antes de tocar producción
- `start/stop/restart/rebuild` en práctica operativa diaria se usan sobre todo en `dev`
- `rebuild` está acotado a `dev`
- `deploy prod` y `promote prod` apuntan al mismo flujo soportado
- ambos deben dejar release auditada o fallar con error accionable
- `stop prod` requiere confirmacion interactiva o `--yes` en modo no-interactivo
- `promote prod` requiere confirmacion interactiva o `--yes` en modo no-interactivo
- `deploy prod` requiere confirmacion interactiva o `--yes` en modo no-interactivo
- `rollback prod` requiere confirmacion interactiva o `--yes` en modo no-interactivo
- `deploy dev --yes` falla y no promueve prod (argumento debe ser `prod`)
- tratá `prod` como sensible: inspeccioná primero, después actuá

## Do / Don't

### Do

- usá `projectctl status` antes de operar
- leé `logs prod` antes de promover o reiniciar algo sensible
- usá `doctor` cuando haya drift, puertos raros o config faltante
- mantenete siempre en scope proyecto

### Don't

- no corras Docker raw en `sandbox`
- no asumas que `deploy prod` es un flujo distinto de `promote prod`
- no uses `rebuild dev` como solución mágica para cualquier error
- no interpretes `docker: command not found` como bug: es un boundary de seguridad
