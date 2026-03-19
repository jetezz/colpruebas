# Test Plan

## How to determine the test domain

The test domain is determined dynamically by reading `.mis-proyectos/environment.docker.md`:

1. Read `.mis-proyectos/environment.docker.md`
2. Extract `deploy_branch_test` and `project_name_test`
3. Construct: `https://{deploy_branch_test}.{project_name_test}.colpruebas.online`

## Fallback

If `.mis-proyectos/environment.docker.md` is not available, use `BASE_URL` environment variable or set `baseURL` in `playwright.config.ts`.

## Notes

- The test environment is hosted remotely, NOT on localhost
- Do NOT attempt to use Docker commands — Docker is not available on this machine
- Use `bun` (not `npm`) for all package manager commands
