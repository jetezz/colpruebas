---
name: projectctl2
description: Use projectctl2's requirements core, shared data types, and SDD task-flow satellite. Load the dedicated point skill that matches the task and follow the package versioning workflow when changing any skill content.
metadata:
  id: projectctl2
  version: 1.1.14
  layer: repo
  type: standard
  license: MIT
  categories:
    - projectcl
---

# projectctl2

`projectctl2` is an aggregate skill package with three parts:

- [`requirements/SKILL.md`](requirements/SKILL.md): the requirements core. Load the point skill that matches the task (criteria, docs, tests, structure, or code).
- `sdd/`: the SDD task-flow satellite. Start from [`sdd/phases/SKILL.md`](sdd/phases/SKILL.md) for the graph and [`sdd/references/flow-guards.md`](sdd/references/flow-guards.md) for mechanics.
- `types/`: the shared data-contract catalog (canonical Zod, generated JSON Schema, `validateDocument` registry).

The shared catalog prevents requirements and SDD from maintaining competing definitions of the same contract.

The `metadata.id` and `metadata.version` above identify and version the complete tree. Subskills carry no independent versions.

Package validation and versioning: run the checker after editing; see [package-versioning](references/package-versioning.md).
