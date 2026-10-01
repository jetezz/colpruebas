// @ac AC-004, AC-008, AC-009 — criteria authority, preserved enums/mapping,
// separated empty ledger, and complete PCT-169..PCT-176 inventory.

import { afterEach, describe, expect, it } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";

import {
  checkProjectctlCriteriaIntegrity,
  CRITERION_TYPES,
  DEFAULT_CRITERIA_PATH,
  DEFAULT_LEDGER_PATH,
} from "../skill/projectctl-criteria-integrity.ts";
import * as criteriaIntegrity from "../skill/projectctl-criteria-integrity.ts";

const ROOT = path.resolve(import.meta.dir, "../../../../..");

describe("PCT-169..PCT-176 — criteria integrity RED contract", () => {
  it("keeps the nine canonical PCT criterion types closed and identical to App Map types", () => {
    expect(CRITERION_TYPES).toEqual([
      "ui",
      "functionality",
      "a11y",
      "backend",
      "data",
      "integration",
      "security",
      "performance",
      "tooling",
    ]);
    expect(CRITERION_TYPES).toHaveLength(9);
  });

  it("keeps the nine types aligned with the portable criteria schema", async () => {
    const schema = JSON.parse(await fs.readFile(
      path.join(ROOT, ".agents/skills/projectctl-requirements/references/schemas/criteria.schema.json"), "utf8",
    ));
    expect(schema.$defs.criterion.properties.type.enum).toEqual(CRITERION_TYPES);
  });

  it("contains the eight new public criteria as a one-to-one manifest inventory", async () => {
    const source = await fs.readFile(path.join(ROOT, DEFAULT_CRITERIA_PATH), "utf8");
    const ids = [...source.matchAll(/^\s+- id: (PCT-16[9]|PCT-17[0-6])\s*$/gm)].map(
      (match) => match[1],
    );

    expect(ids).toEqual([
      "PCT-169",
      "PCT-170",
      "PCT-171",
      "PCT-172",
      "PCT-173",
      "PCT-174",
      "PCT-175",
      "PCT-176",
    ]);
    expect(new Set(ids)).toHaveLength(8);
  });

  it("keeps coverage-ledger separate and revision-bound even when empty", async () => {
    const [ledger, criteria] = await Promise.all([
      fs.readFile(path.join(ROOT, DEFAULT_LEDGER_PATH), "utf8"),
      fs.readFile(path.join(ROOT, DEFAULT_CRITERIA_PATH), "utf8"),
    ]);
    // Ledger is a separated evidence store: it must not redefine criteria normative fields.
    expect(ledger).not.toMatch(/^\s+(?:type|title|requirement|owner):/m);
    // Instance-specific incomplete events are archived outside the portable core.
    // Pins vigentes: criteria_revision == criteria source_revision.
    const criteriaSourceRevision = criteria.match(/source_revision:\s*([a-f0-9]{64})/)?.[1];
    const ledgerCriteriaRevision = ledger.match(/criteria_revision:\s*([a-f0-9]{64})/)?.[1];
    expect(criteriaSourceRevision).toBeDefined();
    expect(ledgerCriteriaRevision).toBe(criteriaSourceRevision);
    // Revision por criterio válida: entry revision == criterion revision (or criteria source_revision).
    const criterionRevisions = new Map(
      [...criteria.matchAll(/- id: (PCT-\d+)\s*\n(?:.*\n)*?\s+revision:\s*([a-f0-9]{64})/g)].map(
        (match) => [match[1], match[2]],
      ),
    );
    const entries = [...ledger.matchAll(/criterion_id:\s*(PCT-\d+)\s*\n(?:.*\n)*?\s+revision:\s*([a-f0-9]{64})/g)];
    for (const match of entries) {
      const expected = criterionRevisions.get(match[1]);
      expect(expected).toBeDefined();
      expect([expected, criteriaSourceRevision]).toContain(match[2]);
    }
    // The closed integrity gate stays green with these entries.
    const report = checkProjectctlCriteriaIntegrity(ROOT);
    expect(report.ok).toBe(true);
    expect(report.issues).toEqual([]);
  });

  it("closes the criteria/ledger integrity gate without redefining criteria in the ledger", () => {
    const report = checkProjectctlCriteriaIntegrity(ROOT);
    expect(report.ok).toBe(true);
    expect(report.issues).toEqual([]);
  });
});

describe("WU-C1-CRITERIA-PINS — tunnel criteria delta", () => {
  it("keeps the abstract readiness criterion and preserves retired IDs only as historical", async () => {
    const source = await fs.readFile(path.join(ROOT, DEFAULT_CRITERIA_PATH), "utf8");
    const activeIds = [...source.matchAll(/^\s+- id: (PCT-\d+)\s*\n(?:.*\n)*?\s+status: active\s*$/gm)].map(
      (match) => match[1],
    );

    expect(activeIds).toContain("PCT-38");
    expect(activeIds).toContain("PCT-95");
    expect(activeIds).toContain("PCT-96");
    expect(activeIds).toContain("PCT-97");
    expect(activeIds).toContain("PCT-98");
    expect(activeIds).toContain("PCT-99");
    expect(activeIds).toContain("PCT-100");
    expect(activeIds).not.toEqual(expect.arrayContaining([
      "PCT-39", "PCT-40", "PCT-41", "PCT-42", "PCT-43", "PCT-44", "PCT-45",
      "PCT-126", "PCT-127", "PCT-128", "PCT-129",
    ]));

    for (const id of ["PCT-39", "PCT-40", "PCT-41", "PCT-42", "PCT-43", "PCT-44", "PCT-45", "PCT-126", "PCT-127", "PCT-128", "PCT-129"]) {
      const start = source.indexOf(`- id: ${id}`);
      const end = source.indexOf("\n  - id:", start + 1);
      expect(source.slice(start, end < 0 ? undefined : end)).toContain("status: historical");
    }

    expect(source).toContain("Readiness/guardrail abstracto");
    expect(source).not.toContain('title: "tunnel: `projectctl tunnel status`');
    expect(source).not.toContain("projectctl tunnel *");
    expect(source).not.toContain("mis-proyectos-tunnel-operator");
    expect(source).not.toContain("projectctl-requirements/ references/standard.md");
  });

  it("does not add public IDs while retaining the portable entorno manifest", async () => {
    const source = await fs.readFile(path.join(ROOT, DEFAULT_CRITERIA_PATH), "utf8");
    const ids = [...source.matchAll(/^\s+- id: (PCT-\d+)\s*$/gm)].map((match) => match[1]);
    expect(new Set(ids)).toHaveLength(ids.length);
    expect(ids.filter((id) => /^PCT-(?:39|40|41|42|43|44|45|126|127|128|129)$/.test(id))).toHaveLength(11);
    expect(ids).toContain("PCT-95");
    expect(ids).toContain("PCT-96");
    expect(ids).toContain("PCT-97");
    expect(ids).toContain("PCT-98");
  });
});

type Diagnostic = {
  code: string;
  check: string;
  severity: string;
  message: string;
  path: string;
  line?: number;
};

type QualityReport = { diagnostics: Diagnostic[]; exitCode: number };
type QualityChecker = (root: string) => Promise<QualityReport> | QualityReport;

const qualityFixtureRoots: string[] = [];

afterEach(async () => {
  await Promise.all(qualityFixtureRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

async function writeQualityFixture(options: { published?: boolean; citation?: string; owner?: string } = {}) {
  const root = await fs.mkdtemp(path.join("/tmp", "projectctl-criteria-quality-"));
  qualityFixtureRoots.push(root);
  const published = options.published ?? true;
  const manifest = published
    ? `criteria:\n  - id: PCT-175\n    status: active\n    owner: "${options.owner ?? "docs/app-map/views/projectctl/index.md"}"\n    source: "docs/app-map/views/projectctl/index.md"\n`
    : "criteria:\n  - id: PCT-174\n    status: active\n    owner: docs/app-map/views/projectctl/index.md\n";
  const bundle = published
    ? "---\ncriteria:\n  - id: PCT-175\n    title: projectctl criteria check\n---\n"
    : "---\ncriteria: []\n---\n";
  const citation = options.citation ?? [
    "> **SoT original**: `docs/app-map/views/projectctl/index.md` + `scripts/projectctl-criteria-integrity.ts`.",
    "> **Cumple**: PCT-175.",
    "> **last-verified**: 2026-09-21.",
  ].join("\n");

  await Promise.all([
    fs.mkdir(path.join(root, ".agents/skills/projectctl-requirements/references/app-map"), { recursive: true }),
    fs.mkdir(path.join(root, "docs/app-map/views/projectctl"), { recursive: true }),
    fs.mkdir(path.join(root, ".agents/skills/projectctl-requirements/references/criterios"), { recursive: true }),
    fs.mkdir(path.join(root, "taskReadme/change"), { recursive: true }),
    fs.mkdir(path.join(root, "sandbox/src/__tests__/lib"), { recursive: true }),
  ]);
  await Promise.all([
    fs.writeFile(path.join(root, ".agents/skills/projectctl-requirements/references/app-map/criteria.yaml"), manifest),
    fs.writeFile(path.join(root, "docs/app-map/views/projectctl/index.md"), bundle),
    fs.writeFile(path.join(root, ".agents/skills/projectctl-requirements/references/criterios/reglas.md"), citation),
    fs.writeFile(path.join(root, ".agents/skills/projectctl-requirements/references/sources.md"), citation),
    fs.writeFile(path.join(root, "taskReadme/change/spec.md"), "### ADDED Requirement: REQ-CRITQA-001\n\nMapping: REQ-CRITQA-001 ↔ PCT-175\n"),
    fs.writeFile(path.join(root, "sandbox/src/__tests__/lib/projectctl-registry.test.ts"), published ? "PCT-175\n" : ""),
  ]);
  return root;
}

async function runQualityCheck(root: string): Promise<QualityReport> {
  const checker = (criteriaIntegrity as { checkProjectctlCriteriaQuality?: QualityChecker }).checkProjectctlCriteriaQuality;
  // This assertion is intentionally the RED seam: the validator is WU-CODE-VALIDATOR work.
  expect(typeof checker).toBe("function");
  return await checker!(root);
}

describe("PCT-175 — criteria quality RED contract", () => {
  it("AC-003: inventories every surface and reports PCT_ID_COLLISION for historical or registry claims", async () => {
    const root = await writeQualityFixture();
    await fs.writeFile(
      path.join(root, ".agents/skills/projectctl-requirements/references/app-map/criteria.yaml"),
      "criteria:\n  - id: PCT-175\n    status: historical\n",
    );
    const report = await runQualityCheck(root);

    expect(report.exitCode).toBe(1);
    expect(report.diagnostics).toContainEqual(expect.objectContaining({
      code: "PCT_ID_COLLISION",
      check: "Q1",
      severity: "error",
      path: expect.stringContaining("criteria.yaml"),
      line: expect.any(Number),
    }));
  });

  it("AC-004: rejects a delta with an orphan or multiply-mapped requirement as MAPPING_NOT_1_TO_1", async () => {
    const root = await writeQualityFixture();
    await fs.writeFile(
      path.join(root, "taskReadme/change/spec.md"),
      "### ADDED Requirement: REQ-CRITQA-001\nMapping: REQ-CRITQA-001 ↔ PCT-175, PCT-176\n",
    );
    const report = await runQualityCheck(root);

    expect(report.diagnostics).toContainEqual(expect.objectContaining({
      code: "MAPPING_NOT_1_TO_1",
      check: "Q2",
      severity: "error",
      path: expect.stringContaining("taskReadme/change/spec.md"),
      line: expect.any(Number),
    }));
    expect(report.exitCode).toBe(1);
  });

  it("AC-005: fails closed when citation blocks are not machine-greppable", async () => {
    const root = await writeQualityFixture({ citation: "> **Cumple**: PCT-174.\n> **last-verified**: yesterday." });
    const report = await runQualityCheck(root);

    expect(report.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(
      expect.arrayContaining(["CITATION_SOT_MISSING", "CITATION_CRITERION_MISSING", "CITATION_DATE_INVALID"]),
    );
    expect(report.diagnostics.every((diagnostic) => diagnostic.check === "Q5")).toBe(true);
    expect(report.exitCode).toBe(1);
  });

  it("AC-006: requires the manifest owner to be the inline bundle and rejects a secondary SoT", async () => {
    const root = await writeQualityFixture({ owner: "docs/app-map/views/projectctl/features/criterios.md" });
    await fs.writeFile(
      path.join(root, ".agents/skills/projectctl-requirements/references/criterios/reglas.md"),
      "# PCT-175\n\n> **SoT original**: `docs/app-map/views/projectctl/index.md`.\n> **Cumple**: PCT-175.\n\nFull requirement definition copied here.\n",
    );
    const report = await runQualityCheck(root);

    expect(report.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "OWNER_INLINE_MISMATCH", check: "Q7", severity: "error" }),
      expect.objectContaining({ code: "REFERENCE_SECONDARY_SOT", check: "Q7", severity: "error" }),
    ]));
    expect(report.exitCode).toBe(1);
  });
});
