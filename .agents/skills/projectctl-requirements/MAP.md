---
schema: projectctl-map/v1
source_revision: 018250bc7be116b983c1f6e47aec7b35b2369798492d974503ec507d8da188ea
status: SOURCE
---

# MAP — projectctl-requirements

Machine-readable core module map. The SDD lane catalog belongs exclusively to `../projectctl-sdd/MAP.md`.

| id | módulo | propósito | autoridad | path | kind | status |
| --- | --- | --- | --- | --- | --- | --- |
| projectctl-requirements | .agents/skills/projectctl-requirements/SKILL.md | Entry point portable del estándar /projectctl | binding |  | package-entry | current |
| projectctl-sdd | .agents/skills/projectctl-sdd/SKILL.md | Satélite opcional de flujo SDD y binding | binding |  | satellite-reference | external |
| projectcl-enviorement | .agents/skills/projectcl-enviorement/SKILL.md | Satélite opcional del runtime gestionado y la tab Entorno | binding |  | satellite-reference | external |
| criteria-manifest | .agents/skills/projectctl-requirements/references/app-map/criteria.yaml | Índice revisionado de IDs y owners PCT; el texto normativo de proyecto vive en sus bundles App Map | criteria-manifest |  | authority-source | current |
| coverage-ledger | .agents/skills/projectctl-requirements/references/app-map/coverage-ledger.yaml | Ledger de evidencia separado de la definición de criterios | coverage-ledger |  | authority-source | current |
