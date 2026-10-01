# Entorno — trazabilidad PCT-95..PCT-100

Estos IDs identifican la tab Entorno de la instancia destino. El contrato operativo del proyecto gestionado reside en [managed-environments.md](managed-environments.md), y el diagnóstico estático en `../scripts/project/doctor-environment.mjs`. Los bundles `docs/app-map/**` de cada instancia conservan la identidad de sus criterios; esta tabla solo enlaza fuentes.

| ID | Contrato / evidencia |
| --- | --- |
| PCT-95 | Índice de compatibilidad de la tab: `SKILL.md` y bundle de la instancia destino. |
| PCT-96 | Topología completa dev/prod: `managed-environments.md` y doctor estático. |
| PCT-97 | Puertos de frontend y API según capacidades: `managed-environments.md` y doctor estático. |
| PCT-98 | Edge y alias por entorno: `managed-environments.md`; publicabilidad viva vía `projectctl doctor`. |
| PCT-99 | Sandbox sin Docker: `managed-environments.md`; runtime vía `projectctl`. |
| PCT-100 | Política operativa: `SKILL.md` y `managed-environments.md`. |
