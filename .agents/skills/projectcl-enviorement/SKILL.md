---
name: projectcl-enviorement
description: "Trigger: projectctl start dev, start prod, deploy prod, environment doctor, managed Compose. Design and diagnose portable managed project environments."
metadata:
  id: projectcl-enviorement
  version: 1.1.0
  layer: repo
  type: satellite
  sot_policy: satellite-extension
  install: copy-tree-no-mods
  license: Apache-2.0
  categories:
    - projectcl
---

# projectcl-enviorement

Este satélite posee las reglas de la tab Entorno (`PCT-95..PCT-100`) de `/projectctl`; el checkout destino posee sus bundles y el operador su runtime. El core `projectctl-requirements` solo enlaza esta autoridad cuando se necesita Entorno.
La [trazabilidad de la tab](references/sources.md) enlaza PCT-95..PCT-100 sin copiar las reglas de runtime.

## Activation Contract

Use for managed-project dev/prod Compose design, deployment readiness, or diagnosing `projectctl` environment startup. Read [the contract](references/managed-environments.md) before proposing changes. Keep platform/root-stack Compose separate from the managed project's Compose.

## Hard Rules

- Treat the current checkout as the source for `start dev`, `start prod`, and `deploy prod`; do not assume a branch promotion or immutable release.
- Supply a complete Compose pair per environment; never infer that `compose.yml` alone is a managed prod topology.
- Never persist managed secrets in the checkout or print configuration values. The operator owns encrypted configuration, credentials, port assignment, edge routing, and the privileged Docker executor.
- Do not run Docker inside the project sandbox. Use `projectctl` for runtime operations.

## Decision Gates

| Situation | Action |
| --- | --- |
| Creating or changing Compose | Read `references/managed-environments.md`; choose one complete topology for each environment. |
| Verifying without mutating runtime | Run `node .agents/skills/projectcl-enviorement/scripts/project/doctor-environment.mjs --root . --json`; inspect failures and unknown configuration. (`scripts/doctor-environment.mjs` remains as a thin compat wrapper.) |
| Starting a managed environment | Obtain an operator-approved configuration, run the doctor, then use `projectctl start dev` or `projectctl start prod --yes`. |
| Publishing a hostname | Verify the actual assignment and edge origin with `projectctl doctor`; static checks alone do not prove reachability. |

## Execution Steps

1. Identify checkout, frontend service, backend capability and operator edge aliases.
2. Validate each effective Compose pair, ports, build contexts and edge topology with the local doctor.
3. Resolve missing checks without fabricating an API service for a frontend-only project.
4. Use the authenticated CLI for live checks; preserve the diagnostic, confirmation and revalidation gates of managed dev.

## Output Contract

Report each environment separately: passed, missing, and unverified checks. Distinguish static readiness from actual runtime/public reachability; provide remediation paths without secret values.

## References

- [Managed environment contract](references/managed-environments.md)
- [Read-only doctor](scripts/project/doctor-environment.mjs) (compat wrapper: `scripts/doctor-environment.mjs`)
- [Package check](scripts/skill/enviorement-check.ts) — `bun .agents/skills/projectcl-enviorement/scripts/skill/enviorement-check.ts --check`

## Script layout

`skill/<id>-check.ts` validates the portable package; `project/doctor-*.mjs` holds
destination-run doctors (`--root . --json`); `scripts/__tests__/` holds their tests.
