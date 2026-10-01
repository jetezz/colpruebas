---
file: references/decisions.md
parent_skill: projectctl-requirements
owner: maintainer
---

# Decisiones del core

1. La identidad de los criterios y su definición `criteria[]` pertenecen a los bundles App Map; `references/criterios/reglas.md` los indexa.
2. La documentación, el test, la estructura/arquitectura y el código conservan trazabilidad por ID mediante sus respectivos contratos del core. El ledger de cobertura registra evidencia, nunca redefine criterios.
3. `metadata.version` versiona este core con independencia de satélites y del binding de tareas.
4. El workflow SDD es opcional y sus decisiones históricas D-12..D-22 y D'1..D'11 se conservan en [`projectctl-sdd/references/decisions.md`](../../projectctl-sdd/references/decisions.md), junto al binding que las implementa.
5. 2026-09-28 (cierre Pasos 6-7): congelación app-map/schemas como contratos machine residentes copy-tree-no-mods, sin cambio de versión.
6. 2026-09-28 (v23.0.0): cada eslabón core tiene una única referencia `references/<función>/reglas.md`; los cuatro índices raíz retirados ya no son locators operativos.
7. 2026-09-28 (v24.0.0): la tab CLI se retiró del ecosistema portable y pertenece a la instancia destino; Entorno y Tareas usan `projectcl-enviorement` y `projectctl-sdd`. No se duplican índices de estas superficies en el core.
8. 2026-09-28 (v25.0.0): el core mantiene solo MAP, el índice revisionado PCT y la cadena de cinco contratos; el generador de tabs y el manifest de capacidades de la instancia viven fuera del paquete.

Las decisiones D-1..D-11 anteriores a esta partición siguen disponibles en el satélite como contexto de migración; las reglas actuales del core se citan en `standard.md`, `sources.md` y `maintenance.md`.
