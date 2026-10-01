# Managed environments: portable contract

This contract describes **projects operated by** `/projectctl`, not the platform's own server stack. Derived from `webhook-listener/src/lib/paths.js`, `webhook-listener/src/handlers/{managed-dev,prod}.js`, and `api/src/routes/environment/shared/runtime-action-core.ts` in the operator repository (verified 2026-09-27). The operator may evolve independently: check its current runtime before upgrading this satellite.

## Files and selection

Each environment must resolve to a complete, ordered topology. The operator selects the first complete candidate **per environment**:

| Priority | Production | Development |
| --- | --- | --- |
| 1 | `compose/compose.yml` + `compose/compose.prod.yml` | `compose/compose.yml` + `compose/compose.dev.yml` |
| 2 | `compose.yml` + `compose.prod.yml` | `compose.yml` + `compose.dev.yml` |
| 3 (legacy) | `docker-compose.yml` | `docker-compose.dev.yml` |

An incomplete `compose/` directory does not supersede a complete root pair. Keep related paths together; do not mix a `compose/` base with a root overlay. `compose.dev.yml` is an overlay, never a standalone managed stack. For new projects prefer the root pairs or `compose/` pairs; legacy is for existing deployments. Version both overlays: a `.gitignore` entry excluding `compose.prod.yml` breaks delivery. `projectctl start prod` on a root project with only `compose.yml` fails topology resolution even if local `docker compose -f compose.yml up` succeeds.

## Services, images, ports

- Define a runnable frontend with a build context or image in each effective topology. Its container listener must match the origin port configured by the operator (the current managed edge convention is `4321`). For dev, bind on `0.0.0.0`; for prod, serve the built application, not a placeholder.
- Give prod and dev distinct frontend services or ensure the prod service is profiled out of the dev effective model. The current canonical managed runtime overlay **adds** `frontend-prod`/`api-prod` for prod and `frontend-dev`/`api-dev` for dev; it does not provide runnable images for those services. A non-legacy frontend-only project currently has an operator compatibility gap: a dummy API makes Compose look complete but does not provide an API. Resolve that gap in the operator's service discovery/runtime overlay or use a supported legacy topology; never invent an idle API solely to satisfy a checklist.
- Interpolate the host frontend port from `FRONTEND_PORT` (prod) / `FRONTEND_DEV_PORT` (dev) into the actual frontend service's `ports`; map to its real container listener. If an API exists, scope its host port to `API_PORT` / `API_DEV_PORT` as appropriate. Do not require API ports when backend is absent.
- Ensure build contexts, Dockerfile targets, source mounts, commands, dependencies and internal networks resolve in the chosen pair. Use a prod target for a built image and a dev target with a real watcher/HMR only if these targets exist in that project's Dockerfile.

## Configuration and edge

- Managed configuration comes from the operator's encrypted environment store and is passed to the executor ephemerally. Do not rely on `.env`/`.env.dev` checked into a managed checkout; examples are documentation only. The doctor can optionally inspect local env files to verify interpolation; absence is `unverified` for managed secrets, not evidence that Supabase configuration is missing. Run `projectctl env validate` against the actual managed environment.
- When a hostname is assigned, declare the operator-managed external edge network and a distinct frontend alias for each environment. The operator's real hostname → origin alias and container port must agree with Compose. Without a hostname, local/Preview operation must not be blocked solely by a missing tunnel assignment; no alias can prove public reachability without the operator.
- Never use `host.docker.internal:<host-port>` as the normal public origin if a managed edge alias exists. `TUNNEL_NOT_PUBLISHABLE` is an operator-side guard on assigned hostnames; static inspection can only flag structural problems.
- Runtime uses project-scoped Compose identity; do not set a global `container_name` or share an edge alias across unrelated projects/environments. Only the privileged executor runs Docker. The sandbox uses authenticated `projectctl`, which delegates through the API with ownership checks.

## Lifecycle and evidence

- `start dev` requires a reachable listener, resolved model, diagnostic allowlist, immediate identity revalidation, port allocation and a post-start check of expected services. A live listener on a port alone is not a managed runtime.
- `start prod --yes` runs Compose `up --build` on the current sandbox checkout, records branch/HEAD/dirty in a receipt and checks tunnel publishability before mutation. `rebuild prod --yes` requires all expected prod services running. `deploy prod --yes` also uses the current checkout; `promote prod` is retired.
- `projectctl doctor` provides runtime and public-readiness evidence. A static doctor cannot assert that Docker is running, the external network exists on the host, an encrypted env is saved, a tunnel connector is healthy or a URL renders correctly. Report those as `unverified`, never `pass`.

## Static doctor

Run `node .agents/skills/projectcl-enviorement/scripts/project/doctor-environment.mjs --root . --json` from a project checkout. Use `--env dev` or `--env prod` for a single mode. The script is read-only, needs only Node 20+, never calls Docker or prints env values, and returns exit 1 if structural checks fail. `--json` emits check IDs, status (`pass`, `fail`, `unverified`), safe remediation and a per-environment summary. It reads selected Compose files and optionally reads `.env`/`.env.dev` if present; it does not resolve remote assignments. Unsupported YAML constructs are `unverified`, not silently certified.

For this demo project specifically, `compose.prod.yml` is missing and its current frontend-only dev Compose includes an idle `api-dev` placeholder. Fixing these belongs to a separate app-runtime change, not to installing this satellite. The doctor must expose the missing prod overlay rather than claim the app is ready.
