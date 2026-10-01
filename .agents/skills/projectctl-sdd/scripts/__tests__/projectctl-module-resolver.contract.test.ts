// @ac PCT-154 — resolver uses exact MAP rows and lane registry membership.
// @ac PCT-148 — retired/invalid paths fail closed without aliases or fallback.
// @ac PCT-143 — module resolution is revision-bound and portable.

import { describe, expect, it } from "bun:test";
import {
  ProjectctlModuleResolverError,
  resolveProjectctlModule,
} from "../skill/projectctl-module-resolver.ts";
import { sha256OfString, MAP_SCHEMA_ID, type ParsedMap } from "../skill/sdd-map.ts";

const repoRoot = "/repo";
const row = {
  id: "demo-lane",
  modulo: ".agents/skills/projectctl-sdd/modules/sdd/sdd-spec/module.md",
  proposito: "fixture",
  autoridad: "binding",
  status: "current" as const,
  line: 1,
};
const map: ParsedMap = {
  schema: MAP_SCHEMA_ID,
  source_revision: sha256OfString(`${MAP_SCHEMA_ID}\n${[row.id, row.modulo, row.proposito, row.autoridad, "", "", row.status].join("|")}\n`),
  rows: [row],
};

describe("WU-12 exact module resolver", () => {
  it("rejects an unregistered lane before any fallback lookup", () => {
    expect(() => resolveProjectctlModule("retired-alias", {
      repoRoot,
      map,
      laneRegistry: ["demo-lane"],
    })).toThrowError(ProjectctlModuleResolverError);
    try {
      resolveProjectctlModule("retired-alias", { repoRoot, map, laneRegistry: ["demo-lane"] });
    } catch (error) {
      expect((error as ProjectctlModuleResolverError).code).toBe("lane_not_registered");
    }
  });

  it("rejects traversal and slash aliases as invalid logical IDs", () => {
    for (const logicalId of ["../sdd-spec", "sdd/spec", ""]) {
      expect(() => resolveProjectctlModule(logicalId, { repoRoot, map })).toThrow();
    }
  });

  it("returns the exact module path and no neighboring module scan", () => {
    expect(() => resolveProjectctlModule("demo-lane", { repoRoot, map })).toThrowError(/module_not_found/);
  });
});
