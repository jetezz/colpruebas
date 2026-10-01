// @ac PCT-154 — task creation and approvals retain explicit revision-bound inputs.
// @ac PCT-164 — generated docs and registry are the only catalog surfaces.
// @ac PCT-165 — auto-writeback remains pending in v1 and cannot close coverage gates.
// @ac PCT-160 — purge is absent from the v1 active contract; tasks-status remains distinct.
//
// Portable boundary contract (v20.0.0): asserts only the portable package
// (binding, portable contracts, manifest schema). Instance surfaces
// (frontend/, sandbox/, <repo>/scripts/ wrappers) are provided by the
// destination and MUST NOT be required here.

import { describe, expect, it } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "../../../../..");
const SKILL_DIR = path.join(ROOT, ".agents", "skills", "projectctl-requirements");

describe("WU-12 v1 boundary contracts (portable)", () => {
  it("keeps the core independent of the optional SDD binding", async () => {
    const skill = await fs.readFile(path.join(SKILL_DIR, "SKILL.md"), "utf8");
    expect(skill).toContain("sin locator SDD");
    expect(skill).not.toContain("binding_role: tasks-binding");
  });

  it("documents the deferred writeback sentinel in the portable contract without treating it as acceptance", async () => {
    const contract = await fs.readFile(
      path.join(SKILL_DIR, "scripts", "project", "test-runner-contract.ts"),
      "utf8",
    );
    expect(contract).toContain("AUTO_WRITEBACK_DEFERRED_V1");
    expect(contract).toContain("pending");
    expect(contract).not.toMatch(/AUTO_WRITEBACK_DEFERRED_V1[\s\S]{0,240}coverageAccepted\s*=\s*true/);
  });

  it("keeps only the MAP and criteria schemas inside the portable core", async () => {
    for (const name of ["criteria", "coverage-ledger", "code-traceability"]) {
      const schema = JSON.parse(await fs.readFile(path.join(SKILL_DIR, "references/schemas", `${name}.schema.json`), "utf8"));
      expect(schema["$id"]).toBeDefined();
    }
    expect(await fs.readdir(path.join(SKILL_DIR, "references/schemas"))).not.toContain("manifest.schema.json");
  });
});
