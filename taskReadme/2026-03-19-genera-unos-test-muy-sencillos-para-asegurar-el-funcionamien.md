---
title: Genera unos test muy sencillos para asegurar el funcionamiento
status: blocked
created: "2026-03-19T11:04:20.976Z"
updated: "2026-03-19T12:30:00.000Z"
source_branch: develop
target_branch: develop
branch_name: 2026-03-19-test-sencillos
pr_url: null
error_message: "Infrastructure not available: Docker not found in environment, API server not running on localhost:3006, Frontend server not running on localhost:8086. Tests cannot execute without the test environment infrastructure running."
project_id: ""
project_url: ""
---

## Descripción

genera test con playwright sencillos que cubran lo esencial

# TASK: Genera unos test muy sencillos para asegurar el funcionamiento

## Meta

Crear un conjunto básico de tests E2E con Playwright que verifiquen el funcionamiento esencial del frontend y backend de la aplicación colpruebas: carga correcta del frontend, conexión con la API, y visualización de la información del entorno (app name, environment, git branch).

## Contexto

- Fecha: `2026-03-19`
- Alcance: MVP
- Proyecto: colpruebas (frontend Astro + backend Express)
- Puertos: Frontend-test:8086, API-test:3006

## Requisitos

- [ ] R1: Configurar entorno de testing con Playwright (@playwright/test)
- [ ] R2: Crear tests E2E para el frontend (página principal carga, muestra info correcta)
- [ ] R3: Crear tests E2E para la API (endpoints /, /health, /api/status responden correctamente)
- [ ] R4: Verificar que los tests pasan en el entorno de test (localhost:8086 y localhost:3006)

## Plan de Implementación

1. **Crear estructura de directorios para tests**
   - Crear directorio `test/` en la raíz del proyecto
   - Crear `test/package.json` con dependencias de Playwright
   - Crear `test/playwright.config.ts` con configuración básica
   - Parallelizable: No (estructura base)

2. **Crear test de API (backend)**
   - Crear `test/tests/api.spec.ts`
   - Test: GET / devuelve JSON con app="colpruebas", environment, version
   - Test: GET /health devuelve status="ok"
   - Test: GET /api/status devuelve JSON con app y environment
   - BaseURL: http://localhost:3006 (API test)
   - Parallelizable: Si (tests independientes)

3. **Crear test de frontend**
   - Crear `test/tests/frontend.spec.ts`
   - Test: Página principal carga sin errores
   - Test: Título de la página contiene "colpruebas"
   - Test: Se muestra el entorno correcto (TEST o PRODUCCIÓN)
   - Test: Card de información visible con filas de datos
   - Test: No hay errores de consola JS
   - BaseURL: http://localhost:8086 (Frontend test)
   - Parallelizable: Si (tests independientes)

4. **Ejecutar y validar tests**
   - Instalar dependencias: `cd test && bun install`
   - Ejecutar tests: `cd test && bun run playwright test`
   - Verificar que todos los tests pasan
   - Parallelizable: No (validación secuencial)

## Validación

- [ ] Verificación funcional: Los tests E2E verifican que frontend y API funcionan correctamente
- [ ] Verificación técnica: Los tests corren sin errores en el entorno local (playwright install, bun run playwright test exit 0)

## Criterios de Aceptación

- [ ] CA1: Directorio `test/` creado con package.json y playwright.config.ts
- [ ] CA2: Tests de API en `test/tests/api.spec.ts` covering endpoints /, /health, /api/status
- [ ] CA3: Tests de frontend en `test/tests/frontend.spec.ts` covering carga de página y contenido
- [ ] CA4: Todos los tests pasan ejecutando `cd test && bun run playwright test`
- [ ] CA5: Los tests usan URLs de entorno de test (localhost:8086 y localhost:3006)

## Riesgos y Notas

- Riesgos:
  - R1: Si los contenedores de Docker no están corriendo, los tests fallarán. Solución: Asegurar que docker-compose up está corriendo antes de ejecutar tests.
  - R2: Playwright necesita instalar browsers. Solución: Ejecutar `bunx playwright install` antes de los tests.
- Notas:
  - N1: El proyecto usa Bun como runtime, no npm/npx. Usar siempre `bun` para comandos.
  - N2: Los tests son para entorno de test (puerto 8086/3006), no producción.
  - N3: No hay tests existentes, este es el primer set de tests.

## TDD Tests

| File | What it validates | Status |
| --- | --- | --- |
| `test/tests/api.spec.ts` | GET / returns JSON with app="colpruebas", environment, version | 🔴 failing (TDD red phase) |
| `test/tests/api.spec.ts` | GET /health returns status="ok" | 🔴 failing (TDD red phase) |
| `test/tests/api.spec.ts` | GET /api/status returns JSON with app and environment | 🔴 failing (TDD red phase) |
| `test/tests/frontend.spec.ts` | Home page loads without 404/500 errors | 🔴 failing (TDD red phase) |
| `test/tests/frontend.spec.ts` | Page title contains "colpruebas" | 🔴 failing (TDD red phase) |
| `test/tests/frontend.spec.ts` | Displays correct environment (TEST or PRODUCCIÓN) | 🔴 failing (TDD red phase) |
| `test/tests/frontend.spec.ts` | Information card is visible | 🔴 failing (TDD red phase) |
| `test/tests/frontend.spec.ts` | No JS console errors | 🔴 failing (TDD red phase) |

**Test Files Created:**
- `test/package.json` - Playwright dependencies
- `test/playwright.config.ts` - Playwright configuration
- `test/tests/api.spec.ts` - API endpoint tests
- `test/tests/frontend.spec.ts` - Frontend E2E tests

## DB Changes

### Estado: not_required

No se requieren cambios en la base de datos. El proyecto no utiliza base de datos (es una aplicación simple de demostración).

## Handoff To gh-specialist

- Crear branch: `git checkout -b 2026-03-19-test-sencillos`
- No se requiere commit adicional en esta fase (el task file se actualiza desde planning)
