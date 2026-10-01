// @ac PCT-106, PCT-107, PCT-108, PCT-109, PCT-110, PCT-111, PCT-112,
// @ac PCT-113, PCT-114, PCT-115, PCT-116, PCT-117, PCT-118, PCT-119,
// @ac PCT-120, PCT-121, PCT-155 — binding path (portable contract).
//
// Portable contract (v20.0.0): asserts only the portable binding. The
// generated Tareas bundle (`docs/app-map/.../tareas.md`) is published by the
// destination instance (not portable) and MUST NOT be required here.

import { describe, expect, it } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "../../../../..");
const BINDING = path.join(ROOT, ".agents/skills/projectctl-sdd/references/tasks/binding.md");

describe("PCT-106..PCT-121 binding contract (portable)", () => {
  it("exposes the informative tab contract through the binding", async () => {
    const binding = await fs.readFile(BINDING, "utf8");
    expect(binding).toContain("TaskFlowBindingV2");
    expect(binding).toContain("15.0.0");
    expect(binding).toContain('"extensions"');
    expect(binding).toContain("task-flow-binding:start");
    expect(binding).toContain("task-flow-binding:end");
  });

  it("uses the relocated binding without a secondary task authority", async () => {
    const binding = await fs.readFile(BINDING, "utf8");
    expect(binding).toContain("references/tasks/binding.md");
    expect(binding).toContain("projectctl-requirements.task-flow");
  });
});
