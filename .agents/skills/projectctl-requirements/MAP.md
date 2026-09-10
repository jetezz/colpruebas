---
schema: projectctl-map/v1
source_revision: 9ea5b879f8a0649bc27e95a5eaf19f42233d83408e7da6fbdafc743b97df2fe8
status: SOURCE
---

# MAP — projectctl-requirements

Machine-readable module map. Required cells are exactly `id | módulo | propósito | autoridad`.
`status=current` requires `módulo` to exist. `status=external` references policies/Gentle-AI that remain outside the portable package.
Internal modules live under `modules/**` and are the only resolvable workflow implementations.

| id | módulo | propósito | autoridad | path | kind | status |
| --- | --- | --- | --- | --- | --- | --- |
| projectctl-requirements | .agents/skills/projectctl-requirements/SKILL.md | Entry point portable del estándar /projectctl | binding |  | package-entry | current |
| binding | .agents/skills/projectctl-requirements/references/tasks/binding.md | Única autoridad machine TaskFlowBindingV2 | binding |  | authority-source | current |
| criteria-manifest | .agents/skills/projectctl-requirements/references/app-map/criteria.yaml | Definición normativa de criterios PCT | criteria-manifest |  | authority-source | current |
| coverage-ledger | .agents/skills/projectctl-requirements/references/app-map/coverage-ledger.yaml | Ledger de evidencia separado de la definición de criterios | coverage-ledger |  | authority-source | current |
| projectctl-registry | sandbox/src/lib/projectctl-registry.ts | SoT ejecutable del catálogo CLI | projectctl-registry |  | authority-source | current |
| coordinator | .agents/skills/projectctl-requirements/modules/coordinator/module.md | Orquestación SDD; módulo interno | binding |  | internal-current | current |
| sd-protocol | .agents/skills/projectctl-requirements/modules/sd-protocol/module.md | Mecanismos SDD universales; entrypoint del árbol de siblings | binding |  | internal-current | current |
| projectctl-root | .agents/skills/projectctl-requirements/modules/projectctl-root/module.md | Contrato del bridge root; módulo interno | binding |  | internal-current | current |
| projectctl-root-wrapper | scripts/projectctl-root.ts | Wrapper root operativo autorizado; no es una segunda skill | binding |  | operational-wrapper | current |
| sdd-init | .agents/skills/projectctl-requirements/modules/sdd/sdd-init/module.md | Lane bootstrap de task | binding |  | internal-current | current |
| sdd-explore-code | .agents/skills/projectctl-requirements/modules/sdd/sdd-explore-code/module.md | Lane exploración de código | binding |  | internal-current | current |
| sdd-explore-research | .agents/skills/projectctl-requirements/modules/sdd/sdd-explore-research/module.md | Lane exploración de research | binding |  | internal-current | current |
| sdd-explore-pwcli | .agents/skills/projectctl-requirements/modules/sdd/sdd-explore-pwcli/module.md | Lane exploración PW-CLI | binding |  | internal-current | current |
| sdd-propose | .agents/skills/projectctl-requirements/modules/sdd/sdd-propose/module.md | Lane proposal | binding |  | internal-current | current |
| sdd-spec | .agents/skills/projectctl-requirements/modules/sdd/sdd-spec/module.md | Lane specs | binding |  | internal-current | current |
| sdd-design | .agents/skills/projectctl-requirements/modules/sdd/sdd-design/module.md | Lane design | binding |  | internal-current | current |
| sdd-tasks | .agents/skills/projectctl-requirements/modules/sdd/sdd-tasks/module.md | Lane tasks breakdown | binding |  | internal-current | current |
| sdd-apply-code | .agents/skills/projectctl-requirements/modules/sdd/sdd-apply-code/module.md | Apply code unificado (low/medium/high) | binding |  | internal-current | current |
| sdd-apply-doc | .agents/skills/projectctl-requirements/modules/sdd/sdd-apply-doc/module.md | Apply documentation | binding |  | internal-current | current |
| sdd-apply-unit-tests | .agents/skills/projectctl-requirements/modules/sdd/sdd-apply-unit-tests/module.md | Apply unit tests | binding |  | internal-current | current |
| sdd-apply-pwauto-tests | .agents/skills/projectctl-requirements/modules/sdd/sdd-apply-pwauto-tests/module.md | Apply PW-AUTO tests | binding |  | internal-current | current |
| sdd-verify-code | .agents/skills/projectctl-requirements/modules/sdd/sdd-verify-code/module.md | Verify code review | binding |  | internal-current | current |
| sdd-verify-units | .agents/skills/projectctl-requirements/modules/sdd/sdd-verify-units/module.md | Verify unit tests | binding |  | internal-current | current |
| sdd-verify-pwauto | .agents/skills/projectctl-requirements/modules/sdd/sdd-verify-pwauto/module.md | Verify PW-AUTO | binding |  | internal-current | current |
| sdd-verify-pwcli | .agents/skills/projectctl-requirements/modules/sdd/sdd-verify-pwcli/module.md | Verify PW-CLI | binding |  | internal-current | current |
| sdd-apply-code-low | .agents/skills/projectctl-requirements/modules/sdd/sdd-apply-code/module.md | Apply code-low | binding |  | internal-current | current |
| sdd-apply-code-medium | .agents/skills/projectctl-requirements/modules/sdd/sdd-apply-code/module.md | Apply code-medium | binding |  | internal-current | current |
| sdd-apply-code-high | .agents/skills/projectctl-requirements/modules/sdd/sdd-apply-code/module.md | Apply code-high | binding |  | internal-current | current |
| judgment-day | .agents/skills/projectctl-requirements/modules/sdd/judgment-day/module.md | Opt-in dual review | binding |  | internal-current | current |
| rdd-phase | .agents/skills/projectctl-requirements/modules/rdd/rdd-phase/module.md | RDD phase adapter; autoridad Gentle-AI | Gentle-AI |  | internal-current | current |
| rdd-review | .agents/skills/projectctl-requirements/modules/rdd/rdd-review/module.md | RDD reviewer/refuter adapter; autoridad Gentle-AI | Gentle-AI |  | internal-current | current |
| rdd-correct | .agents/skills/projectctl-requirements/modules/rdd/rdd-correct/module.md | RDD bounded corrector; autoridad Gentle-AI | Gentle-AI |  | internal-current | current |
| rdd-validate | .agents/skills/projectctl-requirements/modules/rdd/rdd-validate/module.md | RDD targeted validator; autoridad Gentle-AI | Gentle-AI |  | internal-current | current |
| rdd-review-risk | .agents/skills/projectctl-requirements/modules/rdd/rdd-review/module.md | RDD risk lens; autoridad Gentle-AI | Gentle-AI |  | internal-current | current |
| rdd-review-readability | .agents/skills/projectctl-requirements/modules/rdd/rdd-review/module.md | RDD readability lens; autoridad Gentle-AI | Gentle-AI |  | internal-current | current |
| rdd-review-reliability | .agents/skills/projectctl-requirements/modules/rdd/rdd-review/module.md | RDD reliability lens; autoridad Gentle-AI | Gentle-AI |  | internal-current | current |
| rdd-review-resilience | .agents/skills/projectctl-requirements/modules/rdd/rdd-review/module.md | RDD resilience lens; autoridad Gentle-AI | Gentle-AI |  | internal-current | current |
| rdd-refuter | .agents/skills/projectctl-requirements/modules/rdd/rdd-review/module.md | RDD refuter; autoridad Gentle-AI | Gentle-AI |  | internal-current | current |
| frontend-policy | .agents/skills/frontend-policy/SKILL.md | Policy externa de frontend; no se copia al paquete | frontend-policy |  | external-policy | external |
| backend-api-policy | .agents/skills/backend-api-policy/SKILL.md | Policy externa de API/auth; no se copia al paquete | backend-api-policy |  | external-policy | external |
| sandbox-runtime-policy | .agents/skills/sandbox-runtime-policy/SKILL.md | Policy externa de sandbox/PTY; no se copia al paquete | sandbox-runtime-policy |  | external-policy | external |
| supabase-data-policy | .agents/skills/supabase-data-policy/SKILL.md | Policy externa de SQL/RLS; no se copia al paquete | supabase-data-policy |  | external-policy | external |
| skill-creator | .agents/skills/skill-creator/SKILL.md | Policy externa de skills; no se copia al paquete | skill-creator |  | external-policy | external |
| gentle-ai-rdd | third_party/gentle-ai | Autoridad RDD externa; receipts/CAS/gates no se copian | Gentle-AI |  | external-rdd | external |
