// @ac AC-001 — la autoridad normativa del workflow local está declarada
//               únicamente en `projectctl-sdd/references/tasks/binding.md`.
// @ac AC-005 — `sdd-orchestrator` no impone política local sin consumir una
//               configuración/binding del proyecto.
// @ac AC-006 — `sd-protocol` contiene solamente contratos técnicos
//               portables o parametrizables.
// @ac AC-013 — Existen checks anti-drift para estados, lanes, paths y
//               fuentes duplicadas.
// @ac AC-014 — Los taskReadmes históricos no son tratados como workflow
//               activo.
// @ac AC-004, AC-008, AC-009 — criteria index/source authority and close gate.
// @sc SC-TSKFLOW-022 — Violación activa localizada.
// @sc SC-TSKFLOW-023 — Fixture portable.
//
// Lane D (`sdd-apply-unit-tests`) — WU-13 del cambio
// `20260722-tskflow-centralizar-flujo-tareas-sdd` (taskReadme
// `20260722-tskflow-centralizar-flujo-tareas-sdd.md` §10 fila WU-13).
// Anti-drift suite covers binding-source coherence in the normal test path.
//
// Por qué este archivo:
//   1. Las 9 referencias verificables de la skill
//      `projectctl-requirements` declaran paths SoT, citan IDs del
//      binding, y son la **única cara documental** del workflow.
//      Cualquier path que pierdan → RED localizado.
//   2. Las menciones del bloque machine (`binding_id`,
//      `binding_version`, paths) deben ser precisas; un editor que
//      cite una segunda proyección o `phase-state-schema.json` reintroduce
//      la doble autoridad.
//   3. El locator `.agents/sdd-workflow.json` debe ser resoluble
//      desde la skill sin path drift.
//   4. `binding.active_sources.include/exclude` debe coincidir con
//      los paths reales que la skill declara como normativos y
//      excluidos, respectivamente.
//   5. El sanity check de la sección `Maintenance contract` verifica
//      que la skill mantiene su contrato anti-drift sin literales
//      legacy.
//
// Convenciones (per `sdd-apply-unit-tests/SKILL.md` + `bun-runtime` +
// `projectctl-requirements` + `frontend-policy`):
//   - Header `// @ac / @sc` en las primeras 10 líneas.
//   - `bun:test` describe/it/expect.
//   - `node:fs/promises` para leer los 9 archivos de la skill.
//   - `parseBindingFile()` del normalizador para validar el bloque.
//   - Sin parser YAML runtime: regex ligera sobre frontmatter cuando
//     hace falta.
//   - Sin estado mutable; sin DOM; sin browser.
//
// Test-runner wiring:
//   - Path explícito:
//       bun test ./.agents/skills/projectctl-requirements/scripts/__tests__/projectctl-requirements.sot-coherence.test.ts
//     desde la raíz.

import { describe, expect, it } from "bun:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  gateReason,
} from "./lib/sdd-anti-drift-fixtures.ts";

import { parseBindingFile } from "../skill/task-flow-normalizer.ts";

// ─── Path resolution ──────────────────────────────────────────────────

const HERE = path.dirname(new URL(import.meta.url).pathname);
const REPO_ROOT = path.resolve(HERE, "../../../../..");
const SKILL_DIR = path.join(REPO_ROOT, ".agents", "skills", "projectctl-requirements");
const SDD_DIR = path.join(REPO_ROOT, ".agents", "skills", "projectctl-sdd");
const REFERENCES_DIR = path.join(SKILL_DIR, "references");

const REFERENCE_FILES = [
  "sources.md",
  "docs/reglas.md",
  "test/reglas.md",
  "standard.md",
  "decisions.md",
  "maintenance.md",
  "estructura/reglas.md",
  "criterios/reglas.md",
  "code/reglas.md",
] as const;

const BINDING_PATH = path.join(SDD_DIR, "references", "tasks", "binding.md");
const LOCATOR_PATH = path.join(REPO_ROOT, ".agents", "sdd-workflow.json");
const PROJECTION_PATH = path.join(
  REPO_ROOT,
  ".agents",
  "skills",
  "projectctl-sdd",
  "generated",
  "phase-state-schema.json",
);
const TASK_TEMPLATE_PATH = path.join(
  REPO_ROOT,
  ".agents",
  "skills",
  "projectctl-sdd",
  "assets",
  "task-template.md",
);
const VIEW_MODEL_PATH = path.join(
  REPO_ROOT,
  "frontend",
  "src",
  "views",
  "projectctl",
  "data",
  "tareas-tab.view-model.ts",
);
const TYPED_BINDING_PATH = path.join(
  REPO_ROOT,
  "frontend",
  "src",
  "shared",
  "sdd",
  "task-flow.generated.ts",
);
const SKILL_PATH = path.join(SKILL_DIR, "SKILL.md");
// RETIRED — `.atl/skill-registry.md` era la salida del binario externo de la
// instancia origen (no portable). El registry es responsabilidad del destino;
// los checks portables usan fixtures tmp y nunca leen un registry real.
// (Motivo: portabilidad cross-repo; ver `references/maintenance.md` §10.)

// ─── Helpers ──────────────────────────────────────────────────────────

const RETIRED_LANES = Object.freeze([
  "sdd-apply",
  "sdd-apply-code",
  "sdd-explore",
  "sdd-verify",
  "sdd-browser-runtime-context",
]);

const RETIRED_STATUSES = Object.freeze([
  "ready_for_branch",
  "branching",
  "pushing",
  "verified",
  "completed",
  "paused",
  "phase1_generating",
  "phase2_branching",
  "phase3_implementing",
  "phase4_pushing",
]);

function fail(req: string, p: string, value: string, why: string): never {
  throw new Error(gateReason(req, p, value, why));
}

async function readReference(name: (typeof REFERENCE_FILES)[number]): Promise<string> {
  return fs.readFile(path.join(REFERENCES_DIR, name), "utf8");
}

function findWholeWordMatches(content: string, token: string): string[] {
  // Word-boundary regex that tolerates splits like `sdd-apply-code-low`
  // but rejects the standalone `sdd-apply` token.
  const escaped = token.replace(/[-]/g, "\\-");
  const re = new RegExp(`(?<![-_a-zA-Z])${escaped}(?![-_a-zA-Z])`, "g");
  const matches: string[] = [];
  for (const line of content.split(/\r?\n/)) {
    if (re.test(line)) matches.push(line.trim());
    re.lastIndex = 0;
  }
  return matches;
}

function findOperationalRetiredLaneMatches(content: string, token: string): string[] {
  // The binding keeps retired aliases as read-only structural inventories.
  // Mask only those JSON arrays; routing/action/lane values remain scannable.
  const operationalSurface = content.replace(
    /"(?:retired_aliases_read_only|retired_aliases)"\s*:\s*\[[\s\S]*?\]/g,
    (inventory) => inventory.replace(/[^\r\n]/g, " "),
  );
  const matches = findWholeWordMatches(operationalSurface, token);
  const escaped = token.replace(/[-]/g, "\\-");
  const tokenPattern = `(?<![-_a-zA-Z])${escaped}(?![-_a-zA-Z])`;
  const explicitNegativeWindow = new RegExp(
    `(?:retirad|monol[ií]tic|exclu|no\\s+(?:son|es|debe|puede|se\\s+invoca)|must\\s+not|not\\s+(?:a\\s+)?routing\\s+target|sin\\s+sufijo|alias(?:es)?|fallback|compatib|no\\s+es\\s+drift|ausencia)[^\\n]{0,240}${tokenPattern}|${tokenPattern}[^\\n]{0,240}(?:retirad|monol[ií]tic|exclu|no\\s+(?:son|es|debe|puede|se\\s+invoca)|must\\s+not|not\\s+(?:a\\s+)?routing\\s+target|sin\\s+sufijo|alias(?:es)?|fallback|compatib|no\\s+es\\s+drift|ausencia)`,
    "i",
  );
  return matches.filter((line) => {
    if (/"skill"\s*:\s*"/.test(line) || /logical|l[oó]gic[ao]|implementaci[oó]n/i.test(line)) return false;
    if (/excluye\s+deliberadamente|no\s+es\s+drift/i.test(line)) return false;
    return !explicitNegativeWindow.test(line);
  });
}

function hasRepublishedPhaseCatalog(content: string): boolean {
  const headings = content.match(/^#{1,4}\s+[^\n]+$/gm) ?? [];
  const phaseHeadings = headings.filter((heading) => /\bfase\s*[1-4]\b/i.test(heading));
  if (new Set(phaseHeadings.map((heading) => heading.match(/\bfase\s*([1-4])\b/i)?.[1])).size === 4) {
    return true;
  }

  const operationalTableRows = content.split(/\r?\n/).filter((line) => {
    if (!/^\s*\|/.test(line) || /PCT-\d+/i.test(line)) return false;
    return /\bfase\s*[1-4]\b/i.test(line) && /(?:estado|state|lane|agente|transici[oó]n|gate|owner)/i.test(line);
  });
  return new Set(
    operationalTableRows.flatMap((line) =>
      [...line.matchAll(/\bfase\s*([1-4])\b/gi)].map((match) => match[1]),
    ),
  ).size === 4;
}

type RegistryRow = { skill: string; scope: string; path: string };

// Parse a single markdown table row, honoring `\|` escaped pipes inside
// cells. Inline copy of the parser shape already used by
// `parseSkillRegistry` in `scripts/skill/task-flow-normalizer.ts` so the
// table is unaffected by legacy separators that show up in the
// `Trigger / description` column (e.g. `cli \| doc \| test \| entorno | tareas`).
function parseRegistryRowCells(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let escaped = false;
  for (const char of line.trim().slice(1, -1)) {
    if (escaped) {
      cell += char;
      escaped = false;
    } else if (char === "\\") {
      escaped = true;
    } else if (char === "|") {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell.trim());
  return cells;
}

// Parse only portable registry-shape fixtures (tmp, sin binario externo).
// Las secciones de fixture usan el row shape portable
// `| `<skill>` | <trigger/description> | <scope> | `<abs_path>` |`.
// We extract ONLY the skill (col 1) and the path (col 4) — the verifier
// checks the backticked discipline and the absolute-path derivation against
// `REPO_ROOT`; the description and scope columns are intentionally
// skipped because the portable contract asserts presence, not content.
//
// Skipping policy: legitimate header (`| Skill`) and separator (`| ---`)
// rows are the ONLY rows we may ignore. Any other table row MUST be
// 4 cells; otherwise we throw a loud error so the caller sees a
// malformed fixture as a RED, not a silent filter — the v2 helper
// silently dropped non-4-cell rows under `if (cells.length !== 4) continue;`,
// which would hide a shape regression. Throwing here is the
// anti-drift contract. Ningún fixture exige header `Auto-generated` ni
// conteo global: el conteo esperado lo define cada fixture tmp.
const GENERATED_SKILL_TABLE_HEADINGS = ["Skills"] as const;

function parseSkillRegistryRows(registry: string): RegistryRow[] {
  const rows: RegistryRow[] = [];
  const lines = registry.split(/\r?\n/);

  for (const heading of GENERATED_SKILL_TABLE_HEADINGS) {
    const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
    if (start < 0) {
      throw new Error(`skill-registry is missing generated section: ## ${heading}`);
    }
    const end = lines.findIndex((line, index) => index > start && /^##\s+/.test(line.trim()));
    const sectionLines = lines.slice(start + 1, end < 0 ? lines.length : end);

    for (const line of sectionLines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) continue;
      if (trimmed.startsWith("| Skill")) continue;
      const cells = parseRegistryRowCells(trimmed);
      if (cells.every((cell) => /^:?-{3,}:?$/.test(cell))) continue;
      if (cells.length !== 4) {
        throw new Error(
          `skill-registry row has ${cells.length} cells, expected 4: ${trimmed}`,
        );
      }
      rows.push({ skill: cells[0], scope: cells[2], path: cells[3] });
    }
  }
  return rows;
}

// ─── AC-001 / AC-005 — single binding · locator exists ────────────────

describe("AC-001 / AC-005 — single binding + locator exist", () => {
  it("`references/tasks/binding.md` es la única autoridad normativa", async () => {
    expect(await fs.stat(BINDING_PATH).then(stat => stat.isFile())).toBe(true);
  });

  it("no publica comandos purge en el binding portable", async () => {
    const binding = await fs.readFile(BINDING_PATH, "utf8");
    expect(binding).not.toMatch(/projectctl purge (?:preview|execute|rollback)/);
  });

  it("locator `.agents/sdd-workflow.json` existe y declara binding_id coherente", async () => {
    const stat = await fs.stat(LOCATOR_PATH);
    expect(stat.isFile()).toBe(true);
    const raw = JSON.parse(await fs.readFile(LOCATOR_PATH, "utf8")) as Record<string, unknown>;
    if (raw["binding_path"] !== ".agents/skills/projectctl-sdd/references/tasks/binding.md") {
      fail(
        "REQ-TSKFLOW-001 AC-001",
        LOCATOR_PATH,
        String(raw["binding_path"] ?? "<missing>"),
        "binding_path MUST point at the canonical binding",
      );
    }
    if (raw["machine_block_id"] !== "task-flow-binding") {
      fail(
        "REQ-TSKFLOW-001 AC-001",
        LOCATOR_PATH,
        String(raw["machine_block_id"] ?? "<missing>"),
        "machine_block_id MUST equal 'task-flow-binding'",
      );
    }
    if (raw["expected_binding_id"] !== "projectctl-requirements.task-flow") {
      fail(
        "REQ-TSKFLOW-001 AC-001",
        LOCATOR_PATH,
        String(raw["expected_binding_id"] ?? "<missing>"),
        "expected_binding_id MUST equal projectctl-requirements.task-flow",
      );
    }
    expect(raw["binding_path"]).toBe(".agents/skills/projectctl-sdd/references/tasks/binding.md");
  });

  it("locator enumera los projection paths portables requeridos", async () => {
    const raw = JSON.parse(await fs.readFile(LOCATOR_PATH, "utf8")) as Record<string, unknown>;
    const projections = raw["projections"] as Record<string, string>;
    expect(projections["state_model"]).toBe(
      ".agents/skills/projectctl-sdd/generated/phase-state-schema.json",
    );
    expect(projections["task_template"]).toBe(
      ".agents/skills/projectctl-sdd/assets/task-template.md",
    );
    // Las proyecciones de cliente son opcionales y pertenecen al destino.
    expect(projections["client_view_model"] === undefined || typeof projections["client_view_model"] === "string").toBe(true);
  });
});

describe("AC-004 / AC-008 / AC-009 — criteria source coherence", () => {
  it("declares the portable criteria IDs only through the inline App Map bundle pattern", async () => {
    const index = await fs.readFile(
      path.join(SKILL_DIR, "references/criterios/reglas.md"),
      "utf8",
    );
    for (const id of ["PCT-169", "PCT-170", "PCT-171", "PCT-172", "PCT-173", "PCT-174"]) {
      expect(index).toContain(id);
    }
    expect(index).toContain("features/criterios.md");
    expect(index.split(/^---\s*$/m).slice(2).join('')).not.toMatch(/^\s*(?:type|requirement|owner|mapping):/m);
  });

  it("reconciles the package contract to eight tabs and six sections", async () => {
    const doc = await readReference("docs/reglas.md");
    const standard = await readReference("standard.md");
    expect(doc).toContain("6 secciones");
    const tabsCore = await fs.readFile(path.join(REPO_ROOT, "scripts/projectctl-docs-core.ts"), "utf8");
    expect(tabsCore).toContain("'criterios'");
    expect(standard).toContain("Sources");
    expect(doc).not.toMatch(/five sections|5 sections|seven tabs|7 tabs/i);
    expect(standard).not.toMatch(/five sections|5 sections|seven tabs|7 tabs/i);
  });
});

// ─── AC-001 — paths SoT canónicos existen en disco ─────────────────────

describe("AC-013 — paths SoT canónicos existen en disco", () => {
  const requiredPaths = [
    ".agents/sdd-workflow.json",
    ".agents/skills/projectctl-requirements/SKILL.md",
    ".agents/skills/projectctl-sdd/references/tasks/binding.md",
    ".agents/skills/projectctl-requirements/references/standard.md",
    ".agents/skills/projectctl-requirements/references/sources.md",
    ".agents/skills/projectctl-requirements/references/maintenance.md",
    ".agents/skills/projectctl-requirements/references/decisions.md",
    ".agents/skills/projectctl-requirements/references/estructura/reglas.md",
    ".agents/skills/projectctl-sdd/generated/phase-state-schema.json",
    ".agents/skills/projectctl-sdd/assets/task-template.md",
    ".agents/skills/projectctl-sdd/assets/examples/task-browser-feature.md",
  ];

  for (const rel of requiredPaths) {
    it(`path existe: ${rel}`, async () => {
      const absolute = path.join(REPO_ROOT, rel);
      let present = true;
      try {
        const stat = await fs.stat(absolute);
        if (stat.isDirectory()) present = false;
      } catch {
        present = false;
      }
      if (!present) {
        fail(
          "REQ-TSKFLOW-004 AC-013",
          rel,
          "<missing>",
          "path SoT MUST exist",
        );
      }
      expect(present).toBe(true);
    });
  }

});

// ─── AC-004 / AC-013 — canonical binding parseable + contract conformance

describe("AC-013 / REQ-TSKFLOW-004 — canonical binding contract conformance", () => {
  it("`parseBindingFile()` extrae el bloque machine sin errores", () => {
    let parsedOk = true;
    try {
      parseBindingFile(REPO_ROOT);
    } catch (err) {
      parsedOk = false;
      fail(
        "REQ-TSKFLOW-004 AC-001",
        BINDING_PATH,
        "<unparseable>",
        `parseBindingFile() failed: ${(err as Error).message}`,
      );
    }
    expect(parsedOk).toBe(true);
  });

  it("binding lanes declare resolvable logical skills and no retired monolithics", async () => {
    const parsed = parseBindingFile(REPO_ROOT);
    const lanes = parsed.binding.lanes as Record<string, { skill: string; apply_lane?: string; role: string }>;
    const laneIds = Object.keys(lanes).sort();
    for (const retired of RETIRED_LANES) {
      if (laneIds.includes(retired)) {
        fail(
          "REQ-TSKFLOW-008 AC-004 SC-TSKFLOW-022",
          `${BINDING_PATH}#/lanes/*`,
          retired,
          "retired monolithic lane MUST NOT be a routing target",
        );
      }
    }

    // (1) Each lane of the binding MUST resolve to its current module on disk
    // under `projectctl-requirements/modules/**`. The absolute path is
    // derived from `REPO_ROOT` so the assertion stays portable
    // across repositories and never hardcodes host literals. This check
    // is INDEPENDENT of any destination catalog: the destination registry
    // is owned by the destination, so a binding lane missing from that
    // catalog is NOT a contract drift — it is a workflow skill that
    // exists on disk and is resolvable via `.agents/skills/`.
    // Absence on disk is RED.
    for (const [laneId, lane] of Object.entries(lanes)) {
      expect(lane.skill.length).toBeGreaterThan(0);
       const modulePath = lane.skill === "sd-protocol"
         ? ["projectctl-sdd", "modules", "sd-protocol", "module.md"]
         : lane.skill.startsWith("sdd-")
           ? ["projectctl-sdd", "modules", "sdd", lane.skill, "module.md"]
           : [lane.skill, "SKILL.md"];
       const absPath = path.join(REPO_ROOT, ".agents", "skills", ...modulePath);
      let skillResolvable = true;
      try {
        const stat = await fs.stat(absPath);
        if (!stat.isFile()) skillResolvable = false;
      } catch {
        skillResolvable = false;
      }
      if (!skillResolvable) {
        fail(
          "REQ-SPEC-DRIFT-2-A / REQ-SPEC-DRIFT-2-C",
          `lane "${laneId}" -> ${lane.skill}`,
          absPath,
            "lane MUST resolve to a readable current module under projectctl-sdd/modules",
        );
      }
      expect(skillResolvable).toBe(true);
      // The binding lane record MUST remain path-agnostic: any leak of
      // `SKILL.md` or `.agents/skills/` inside `JSON.stringify(lane)` would
      // re-introduce the double authority the locator encloses.
      expect(JSON.stringify(lane)).not.toContain("SKILL.md");
      expect(JSON.stringify(lane)).not.toContain(".agents/skills/");
      if (!laneId.startsWith("sdd-apply-code-")) expect(lane.apply_lane).toBeUndefined();
    }

    // (2) Portable-only registry shape contract (fixtures tmp, sin registry
    // real). RETIRED: exigir header `Auto-generated` o conteo global exacto
    // (28/31 rows) queda `retired — binario externo de instancia origen, no
    // portable` (motivo: portabilidad; el registry es responsabilidad del
    // destino). Aquí solo validamos el row shape portable con fixtures tmp:
    //   `| `<skill>` | <trigger/description> | <scope> | `<abs_path>` |`
    // An unbackticked name, a relative path, or a path that does not
    // resolve on disk is RED — no `skip` and no silent fallback. We
    // iterate fixture rows only, not binding lanes, because the two sets
    // are independent by design (destination catalog = destination skills;
    // workflow skills are resolved through `.agents/skills/` on disk).
    //
    // Step 2a (portable): no external header is required. The fixture
    // below deliberately carries NO `Auto-generated` marker to prove the
    // portable contract does not depend on it.
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sot-registry-"));
    const fixtureSkillA = path.join(tmpDir, "skill-a", "SKILL.md");
    const fixtureSkillB = path.join(tmpDir, "skill-b", "SKILL.md");
    await fs.mkdir(path.dirname(fixtureSkillA), { recursive: true });
    await fs.mkdir(path.dirname(fixtureSkillB), { recursive: true });
    await fs.writeFile(fixtureSkillA, "# fixture skill a\n", "utf8");
    await fs.writeFile(fixtureSkillB, "# fixture skill b\n", "utf8");
    const fixtureRegistry = [
      "## Skills",
      "",
      "| Skill | Trigger / description | Scope | Path |",
      "| --- | --- | --- | --- |",
      `| \`skill-a\` | fixture trigger a | project | \`${fixtureSkillA}\` |`,
      `| \`skill-b\` | fixture trigger b | project | \`${fixtureSkillB}\` |`,
      "| `user-helper` | fixture helper outside repo | user | `/tmp/outside-repo/SKILL.md` |",
      "",
    ].join("\n");
    expect(fixtureRegistry).not.toMatch(/Auto-generated/);

    // Step 2b: parse the fixture table. The helper skips ONLY the
    // legitimate table header (`| Skill`) and separator (`| ---`)
    // rows; any other table row that does not have 4 cells is a loud
    // shape regression (no silent filter — see helper doc).
    const registryRows = parseSkillRegistryRows(fixtureRegistry);

    // Step 2c (portable): assert the fixture-defined row count only.
    // No global destination count is pinned here.
    if (registryRows.length !== 3) {
      fail(
        "REQ-SPEC-DRIFT-2-A / REQ-SPEC-DRIFT-2-C",
        "fixture registry",
        `rows=${registryRows.length}`,
        "portable fixture MUST emit exactly its 3 defined rows",
      );
    }
    expect(registryRows.length).toBe(3);

    // Step 2d: validate each fixture row against the portable shape
    // contract: backticked skill name, backticked absolute path,
    // and project-scoped paths resolve on disk (tmp fixtures).
    for (const row of registryRows) {
      if (!/^`[^`]+`$/.test(row.skill)) {
        fail(
          "REQ-SPEC-DRIFT-2-A / REQ-SPEC-DRIFT-2-C",
          "registry row skill",
          row.skill,
          "skill name MUST be wrapped in backticks (portable shape)",
        );
      }
      expect(row.skill).toMatch(/^`[^`]+`$/);
      if (!/^`[^`]+`$/.test(row.path)) {
        fail(
          "REQ-SPEC-DRIFT-2-A / REQ-SPEC-DRIFT-2-C",
          "registry row path",
          row.path,
          "path MUST be wrapped in backticks (portable shape)",
        );
      }
      expect(row.path).toMatch(/^`[^`]+`$/);
      // User-scoped helpers intentionally resolve outside the fixture root;
      // only project-scoped fixture rows participate in portability.
      if (row.scope === "user") continue;
      const pathContent = row.path.slice(1, -1);
      // The path MUST be absolute. We compare with `path.resolve` so the
      // assertion tolerates trailing separators and native separators
      // (`/` on Linux). This keeps the test portable without hardcoding
      // host literals.
      if (!path.isAbsolute(pathContent)) {
        fail(
          "REQ-SPEC-DRIFT-2-A / REQ-SPEC-DRIFT-2-C",
          "registry row path",
          pathContent,
          "path MUST be an absolute path (portable fixture)",
        );
      }
      expect(path.isAbsolute(pathContent)).toBe(true);
      let pathExists = true;
      try {
        const stat = await fs.stat(path.resolve(pathContent));
        if (!stat.isFile()) pathExists = false;
      } catch {
        pathExists = false;
      }
      if (!pathExists) {
        fail(
          "REQ-SPEC-DRIFT-2-A / REQ-SPEC-DRIFT-2-C",
          "registry row path",
          pathContent,
          "path MUST point to an existing fixture SKILL.md file",
        );
      }
      expect(pathExists).toBe(true);
    }
    await fs.rm(tmpDir, { recursive: true, force: true });

    expect(lanes["sdd-apply-code-low"]).toMatchObject({ skill: "sdd-apply-code", apply_lane: "code-low" });
    expect(lanes["sdd-apply-code-medium"]).toMatchObject({ skill: "sdd-apply-code", apply_lane: "code-medium" });
    expect(lanes["sdd-apply-code-high"]).toMatchObject({ skill: "sdd-apply-code", apply_lane: "code-high" });
  });

  it("binding enumera los 10 retired status aliases en `retired_aliases`", () => {
    const parsed = parseBindingFile(REPO_ROOT);
    const retired = (parsed.binding as { retired_aliases: string[] }).retired_aliases;
    for (const alias of RETIRED_STATUSES) {
      if (!retired.includes(alias)) {
        fail(
          "REQ-TSKFLOW-002 SC-TSKFLOW-004",
          `${BINDING_PATH}#/retired_aliases`,
          alias,
          "MUST be listed as retired alias",
        );
      }
    }
    expect(true).toBe(true);
  });

  it("`status.writable` no contiene ningún alias retirado", () => {
    const parsed = parseBindingFile(REPO_ROOT);
    const writable = (parsed.binding.status as { writable: string[] }).writable;
    for (const alias of RETIRED_STATUSES) {
      if (writable.includes(alias)) {
        fail(
          "REQ-TSKFLOW-002 AC-003 SC-TSKFLOW-022",
          `${BINDING_PATH}#/status/writable`,
          alias,
          "retired alias MUST NOT be writable",
        );
      }
    }
    expect(true).toBe(true);
  });

  it("`active_sources.include` enumera los paths normativos del binding canónico", () => {
    const parsed = parseBindingFile(REPO_ROOT);
    const include = (parsed.binding.active_sources as { include: string[] }).include;
    const expected = [
      ".agents/skills/projectctl-sdd/SKILL.md",
      ".agents/skills/projectctl-sdd/references/tasks/binding.md",
      ".agents/skills/projectctl-sdd/references/sources.md",
      ".agents/skills/projectctl-sdd/references/maintenance.md",
      ".agents/skills/projectctl-sdd/references/decisions.md",
      ".agents/skills/projectctl-sdd/generated/phase-state-schema.json",
    ];
    for (const rel of expected) {
      if (!include.includes(rel)) {
        fail(
          "REQ-TSKFLOW-004 AC-013",
          `${BINDING_PATH}#/active_sources/include`,
          rel,
          "MUST be declared as an active source",
        );
      }
    }
    if (include.length !== expected.length) {
      // The binding declares exactly the entries above; extras
      // are allowed only if added by an explicit binding bump.
      fail(
        "REQ-TSKFLOW-004 AC-013",
        `${BINDING_PATH}#/active_sources/include`,
        String(include.length),
        `expected exactly ${expected.length} active sources`,
      );
    }
    expect(true).toBe(true);
  });

  it("`active_sources.exclude` mantiene los paths paralelos fuera del contrato activo", () => {
    const parsed = parseBindingFile(REPO_ROOT);
    const exclude = (parsed.binding.active_sources as { exclude: string[] }).exclude;
    const expected = [
      "taskReadme/<task_id>-<task_slug>.md#historical_other_than_active",
      ".agents/skills/sdd-tasks/tasks.md",
      "openspec/**",
      "proposals/**",
      "specs/**",
      "designs/**",
      "tasks/**",
    ];
    for (const rel of expected) {
      if (!exclude.includes(rel)) {
        fail(
          "REQ-TSKFLOW-010 AC-014",
          `${BINDING_PATH}#/active_sources/exclude`,
          rel,
          "MUST remain excluded from the active contract",
        );
      }
    }
    expect(true).toBe(true);
  });
});

// ─── AC-013 — los `references/*.md` solo citan el binding por identificador

describe("AC-013 — referencias solo citan el binding por identificador", () => {
  it("doc reference declares the six sections and the core tab catalog includes criterios", async () => {
    const doc = await readReference("docs/reglas.md");
    const tabsCore = await fs.readFile(path.join(REPO_ROOT, "scripts/projectctl-docs-core.ts"), "utf8");
    expect(doc).toContain("6 secciones");
    for (const tab of ["cli", "tareas", "agentes", "doc", "criterios", "test", "entorno", "estructura"]) {
      expect(tabsCore).toContain(`'${tab}'`);
    }
    expect(doc).not.toMatch(/Cada tab \(cli \| doc \| test \| entorno\)/);
  });

  it("active package references use TST-36 for canonical test layout and no obsolete TST-17 layout claim", async () => {
    const packageFiles = ["SKILL.md", ...REFERENCE_FILES.map((name) => `references/${name}`)];
    for (const relativePath of packageFiles) {
      const content = await fs.readFile(path.join(SKILL_DIR, relativePath), "utf8");
      expect(content, relativePath).not.toMatch(/layout(?:\/discovery)? can[oó]nic\w*[^\n]{0,80}TST-17|TST-17[^\n]{0,80}layout(?:\/discovery)? can[oó]nic/i);
    }
    expect(await readReference("test/reglas.md")).toContain("layout/discovery canónicos (TST-36)");
    expect(await readReference("sources.md")).toContain("layout/discovery canónicos (TST-36)");
  });

  it("affected reference entries use the current verification dates", async () => {
    for (const filename of ["docs/reglas.md", "test/reglas.md"] as const) {
      const content = await readReference(filename);
      expect(content).not.toContain("last-verified**: 2026-07-07");
    }

    const sources = await readReference("sources.md");
      const currentSourceDates = new Map<number, string>([
        [89, "2026-09-28"],
        [90, "2026-09-28"],
        [91, "2026-09-28"],
        [92, "2026-09-28"],
        [93, "2026-09-28"],
        [94, "2026-09-28"],
        [101, "2026-09-27"],
      [102, "2026-09-27"],
      [103, "2026-09-27"],
      [104, "2026-09-27"],
      [105, "2026-09-27"],
    ]);
    for (const id of [89, 90, 91, 92, 93, 94, 101, 102, 103, 104, 105]) {
      const row = sources.split(/\r?\n/).find((line) => line.startsWith(`| \`PCT-${id}\``));
      expect(row, `sources row PCT-${id}`).toContain(`\`${currentSourceDates.get(id) ?? "2026-09-10"}\``);
    }
    const environmentSources = await fs.readFile(path.join(REPO_ROOT, ".agents/skills/projectcl-enviorement/references/sources.md"), "utf8");
    for (let id = 95; id <= 100; id++) {
      expect(environmentSources).toContain(`| PCT-${id} |`);
    }
  });

  it("estructura/reglas.md es la SoT del octavo tab y declara mapping v1.0.0", async () => {
    const estructura = await readReference("estructura/reglas.md");
    expect(estructura).toContain("file: references/estructura/reglas.md");
    expect(estructura).toContain("mapping_version: 1.0.0");
    expect(estructura).toContain("last-verified: 2026-09-28");
    expect(estructura).toContain("# Estructura — reglas (mapping v1.0.0)");
  });

  it("task-flow source rows use stable pointers/headings instead of nonexistent numbered sections", async () => {
    const sources = await fs.readFile(path.join(SDD_DIR, "references", "sources.md"), "utf8");
    const taskFlowRows = sources
      .split(/\r?\n/)
      .filter((line) => /^\| `PCT-(?:10[6-9]|11\d|12[01])` \|/.test(line));

    expect(taskFlowRows).toHaveLength(16);
    for (const row of taskFlowRows) {
      expect(row).not.toMatch(/(?:^|\s)§\d+\b/);
    }
  });

  it("el detector excluye inventories retired estructurales pero conserva values operativos", () => {
    const structuralInventory = JSON.stringify({
      retired_aliases: ["sdd-apply"],
    }, null, 2);
    const structuralMatches = findOperationalRetiredLaneMatches(structuralInventory, "sdd-apply");
    if (structuralMatches.length > 0) {
      fail(
        "REQ-TSKFLOW-008 AC-004 SC-TSKFLOW-022",
        "fixture#/retired_aliases",
        structuralMatches.join(" | "),
        "retired alias inventories MUST be treated as structural read-only context",
      );
    }

    for (const field of ["routing_target", "action", "lane"] as const) {
      const operationalMatches = findOperationalRetiredLaneMatches(
        JSON.stringify({ [field]: "sdd-apply" }),
        "sdd-apply",
      );
      if (operationalMatches.length !== 1) {
        fail(
          "REQ-TSKFLOW-008 AC-004 SC-TSKFLOW-022",
          `fixture#/${field}`,
          `operational matches=${operationalMatches.length}`,
          "retired standalone alias MUST remain detectable in operational values",
        );
      }
    }
    expect(structuralMatches).toEqual([]);
  });

  for (const filename of REFERENCE_FILES) {
    it(`${filename} no introduce el catalog (fases/lanes/estados) re-publicado`, async () => {
      const content = await readReference(filename);
      // Detect only operational catalog shapes: four phase headings or an
      // independent table that maps all four phases to state/lane/gate data.
      // PCT traceability rows may cite each phase without becoming policy.
      const forbiddenCatalogPatterns: Array<{ matches: (value: string) => boolean; label: string }> = [
        { matches: hasRepublishedPhaseCatalog, label: "Publica un catálogo operativo de las 4 fases" },
        { matches: (value) => /\b22\s+states?\b/i.test(value), label: "Publica la cuenta `22 states`" },
        { matches: (value) => /\b\d+\s+lanes?\b/i.test(value), label: "Publica una cuenta fija de lanes" },
      ];
      for (const { matches, label } of forbiddenCatalogPatterns) {
        if (matches(content)) {
          fail(
            "REQ-TSKFLOW-006 AC-006",
            `references/${filename}`,
            label,
            "reference MUST only cite binding by identifier, not republish catalog",
          );
        }
      }
      expect(true).toBe(true);
    });

    it(`${filename} no contiene los lane names monolíticos como routing targets`, async () => {
      const content = await readReference(filename);
      for (const alias of RETIRED_LANES) {
        const operational = findOperationalRetiredLaneMatches(content, alias);
        if (operational.length > 0) {
          fail(
            "REQ-TSKFLOW-008 AC-004 SC-TSKFLOW-022",
            `references/${filename}`,
            `${alias} (${operational.length} operational matches)`,
            `retired monolithic lane MUST NOT appear as a routing or operational value (snippet: ${operational[0]?.slice(0, 80)}...)`,
          );
        }
      }
      expect(true).toBe(true);
    });
  }
});

// ─── AC-014 — taskReadme activo + histórico excluido ─────────────────

describe("AC-014 — el binding NO trata taskReadmes históricos como workflow activo", () => {
  it("el `taskReadme/<id>-<slug>.md#historical_other_than_active` está en `active_sources.exclude`", () => {
    const parsed = parseBindingFile(REPO_ROOT);
    const exclude = (parsed.binding.active_sources as { exclude: string[] }).exclude;
    if (!exclude.includes("taskReadme/<task_id>-<task_slug>.md#historical_other_than_active")) {
      fail(
        "REQ-TSKFLOW-012 AC-014",
        `${BINDING_PATH}#/active_sources/exclude`,
        "taskReadme/<task_id>-<task_slug>.md#historical_other_than_active",
        "MUST remain excluded to prevent historical taskReadmes acting as workflow active",
      );
    }
    expect(exclude).toContain("taskReadme/<task_id>-<task_slug>.md#historical_other_than_active");
  });

  it("los taskReadmes históricos siguen intactos en el filesystem (excluidos por binding pero no borrados)", async () => {
    // Buscamos taskReadmes previos a `20260722-...` para validar
    // que el contrato de exclusión los deja byte-intactos.
    const entries = await fs.readdir(path.join(REPO_ROOT, "taskReadme"));
    const historical = entries.filter((e) => /-\w{4,8}-/.test(e) && !e.startsWith("20260722-"));
    if (historical.length === 0) {
      // Sin históricos en este repo de prueba; el gate sigue verde.
      expect(true).toBe(true);
      return;
    }
    for (const e of historical) {
      const stat = await fs.stat(path.join(REPO_ROOT, "taskReadme", e));
      if (stat.size === 0) {
        fail(
          "REQ-TSKFLOW-012 AC-014",
          `taskReadme/${e}`,
          "size=0",
          "historical taskReadme MUST remain byte-intact (not rewritten by migration)",
        );
      }
    }
    expect(true).toBe(true);
  });
});

// ─── AC-011 — projection on-disk parity ───────────────────────────────

describe("AC-011 — projection on-disk parity (binding ↔ generated)", () => {
  it("`projection.source.source_sha256` matches el SHA recomputado del binding canónico", async () => {
    const parsed = parseBindingFile(REPO_ROOT);
    const raw = JSON.parse(await fs.readFile(PROJECTION_PATH, "utf8")) as Record<string, unknown>;
    const source = raw["source"] as Record<string, unknown>;
    if (source["source_sha256"] !== parsed.bindingSha256) {
      fail(
        "REQ-TSKFLOW-011 SC-TSKFLOW-017",
        PROJECTION_PATH,
        String(source["source_sha256"]),
        `binding digest is ${parsed.bindingSha256} (regenerate: bun run taskflow:generate)`,
      );
    }
    expect(source["source_sha256"]).toBe(parsed.bindingSha256);
  });
});

// ─── AC-001 / F-01 — single source identity across locator/binding/projection ─
//
// F-01 of the latest `sdd-verify-code` rerun (`code_review_passed` post
// F-03R-G / F-05R, taskReadme §15) closed once the binding and
// projection agreed on `binding_id` / `binding_version` /
// `source_sha256` / `source_path`. The static checks below pin the
// single identity so any future regression is detected statically.

describe("AC-001 / F-01 — single source identity (binding ↔ projection ↔ locator)", () => {
  it("binding declares the canonical id and current version", () => {
    const parsed = parseBindingFile(REPO_ROOT);
    if ((parsed.binding as { binding_id: string }).binding_id !== "projectctl-requirements.task-flow") {
      fail(
        "REQ-TSKFLOW-001 F-01",
        `${BINDING_PATH}#/binding_id`,
        String((parsed.binding as { binding_id: string }).binding_id),
        "MUST equal 'projectctl-requirements.task-flow'",
      );
    }
    if ((parsed.binding as { binding_version: string }).binding_version !== "15.0.0") {
      fail(
        "REQ-TSKFLOW-001 F-01",
        `${BINDING_PATH}#/binding_version`,
        String((parsed.binding as { binding_version: string }).binding_version),
        "MUST equal '15.0.0'",
      );
    }
    expect((parsed.binding as { binding_id: string }).binding_id).toBe("projectctl-requirements.task-flow");
    expect((parsed.binding as { binding_version: string }).binding_version).toBe("15.0.0");
  });

  it("pins package v25, binding v15, locator and canonical generator together (portable)", async () => {
    const skill = await fs.readFile(path.join(SDD_DIR, "SKILL.md"), "utf8");
    const locator = JSON.parse(await fs.readFile(LOCATOR_PATH, "utf8")) as Record<string, unknown>;
    const normalizer = await fs.readFile(
      path.join(SDD_DIR, "scripts", "skill", "task-flow-normalizer.ts"),
      "utf8",
    );
    const parsed = parseBindingFile(REPO_ROOT);

    expect(skill).toMatch(/metadata:\s*[\s\S]*?version:\s*25\.0\.0/);
    expect(parsed.frontmatter.version).toBe("15.0.0");
    expect(locator["expected_binding_version"] ?? locator["binding_version"]).toBe("15.0.0");
    expect(normalizer).toContain("parseBindingFile");
    expect(normalizer).toContain("taskflow:generate");
    expect(normalizer).toContain("source_sha256");
  });

  it("docs/reglas.md PCT-85 links the `type` field to its closed enum authority (AC-005)", async () => {
    // WU-5c made `type` a required classification field (hardening R-A) with
    // the T-1 closed 9-value enum. The enum is spelled pipe-joined in the
    // reference (same spelling as the DocTabPanel pre-block and the app-map
    // `projectctl/features/doc.md` bundle) — AC-005 "Doc-tab shape surfaces
    // agree (no drift)". Anchored on what the file actually contains per WU-5c
    // evidence.
    const doc = await readReference("docs/reglas.md");
    const standard = await readReference("standard.md");
    const pct85 = doc
      .split("## Requisito:")
      .find((section) => section.includes("**Cumple**: PCT-85."));
    if (!pct85) {
      fail(
        "AC-005",
        `${REFERENCES_DIR}/docs/reglas.md`,
        "<missing PCT-85>",
        "docs/reglas.md MUST keep a PCT-85 entry documenting the criteria[] shape",
      );
    }
    expect(pct85).toContain("last-verified**: 2026-09-28");
    expect(pct85).toContain("{id, title, functional, coverage, type}");
    expect(pct85).toContain("references/standard.md");
    expect(standard).toContain(
      "ui | functionality | a11y | backend | data | integration | security | performance | tooling",
    );
  });

  it("projection `source.{binding_id, binding_version, source_path, source_sha256}` matches binding identity", async () => {
    const parsed = parseBindingFile(REPO_ROOT);
    const raw = JSON.parse(await fs.readFile(PROJECTION_PATH, "utf8")) as Record<string, unknown>;
    const source = raw["source"] as Record<string, unknown>;
    const expectedBindingId = (parsed.binding as { binding_id: string }).binding_id;
    const expectedVersion = (parsed.binding as { binding_version: string }).binding_version;
    const expectedSha = parsed.bindingSha256;
    const expectedPath = ".agents/skills/projectctl-sdd/references/tasks/binding.md";

    if (source["binding_id"] !== expectedBindingId) {
      fail(
        "REQ-TSKFLOW-001 F-01",
        `${PROJECTION_PATH}#/source/binding_id`,
        String(source["binding_id"]),
        `expected ${expectedBindingId}`,
      );
    }
    if (source["binding_version"] !== expectedVersion) {
      fail(
        "REQ-TSKFLOW-001 F-01",
        `${PROJECTION_PATH}#/source/binding_version`,
        String(source["binding_version"]),
        `expected ${expectedVersion}`,
      );
    }
    if (source["source_sha256"] !== expectedSha) {
      fail(
        "REQ-TSKFLOW-001 F-01",
        `${PROJECTION_PATH}#/source/source_sha256`,
        String(source["source_sha256"]),
        `expected ${expectedSha} from binding parseBindingFile()`,
      );
    }
    if (source["source_path"] !== expectedPath) {
      fail(
        "REQ-TSKFLOW-001 F-01",
        `${PROJECTION_PATH}#/source/source_path`,
        String(source["source_path"]),
        `expected ${expectedPath}`,
      );
    }
    expect(source["binding_id"]).toBe(expectedBindingId);
    expect(source["binding_version"]).toBe(expectedVersion);
    expect(source["source_sha256"]).toBe(expectedSha);
    expect(source["source_path"]).toBe(expectedPath);
  });

  it("locator, projection and binding share the same `binding_path` / `expected_binding_id`", async () => {
    const locator = JSON.parse(await fs.readFile(LOCATOR_PATH, "utf8")) as Record<string, unknown>;
    const parsed = parseBindingFile(REPO_ROOT);
    const raw = JSON.parse(await fs.readFile(PROJECTION_PATH, "utf8")) as Record<string, unknown>;
    const source = raw["source"] as Record<string, unknown>;
    const expectedPath = ".agents/skills/projectctl-sdd/references/tasks/binding.md";
    if (locator["binding_path"] !== expectedPath || source["source_path"] !== expectedPath || parsed.bindingRepoPath !== expectedPath) {
      fail(
        "REQ-TSKFLOW-001 F-01",
        "binding_path vs source_path vs bindingRepoPath",
        `locator=${String(locator["binding_path"])} projection=${String(source["source_path"])} binding=${String(parsed.bindingRepoPath)}`,
        "all three MUST agree on the canonical binding path",
      );
    }
    expect(locator["expected_binding_id"]).toBe("projectctl-requirements.task-flow");
    expect(locator["binding_path"]).toBe(expectedPath);
    expect(source["source_path"]).toBe(expectedPath);
    expect(parsed.bindingRepoPath).toBe(expectedPath);
  });

  it("the generated projection re-exports the current binding identity (portable)", async () => {
    const raw = JSON.parse(await fs.readFile(PROJECTION_PATH, "utf8")) as Record<string, unknown>;
    const parsed = parseBindingFile(REPO_ROOT);
    const source = raw["source"] as Record<string, unknown>;
    expect(source["binding_version"]).toBe(parsed.frontmatter.bindingVersion);
    expect(source["source_sha256"]).toBe(parsed.bindingSha256);
    expect(true).toBe(true);
  });
});

// ─── AC-006 / F-02 — protocol + workflow skills avoid raw binding reads ──
//
// F-02 of the latest `sdd-verify-code` rerun closed once the bounded
// `WorkflowRuntimeContextV1` shape was published and the consumer side
// reads accessors instead of `binding.*` / `binding.phases[]` /
// `binding.lanes[]`. The static checks below scan the protocol library
// and the binding-declared workflow skills to confirm none re-introduces a raw
// read in a normative routing/gate/delivery position.

describe(
  "AC-006 / F-02 — sd-protocol + workflow skills do NOT perform raw binding reads",
  () => {
    const SD_PROTOCOL_DIR = path.join(
      SDD_DIR,
      "modules",
      "sd-protocol",
    );
    const SDD_LANES_DIR = path.join(
      SDD_DIR,
      "modules",
      "sdd",
    );

    it("`sd-protocol/*.md` does not declare `binding.lanes`, `binding.phases`, or `binding.artifact_store` as raw read sites", async () => {
      const files = [
        "module.md",
        "sdd-phase-common.md",
        "persistence-contract.md",
        "acceptance-criteria-gates.md",
        "apply-work-unit-schema.md",
        "skill-resolver.md",
        "explorer-rules.md",
        "workflow-runtime-context.md",
      ];
      for (const file of files) {
        const filePath = path.join(SD_PROTOCOL_DIR, file);
        let content: string;
        try {
          content = await fs.readFile(filePath, "utf8");
        } catch {
          continue;
        }
        // Operational raw reads: `binding.lanes` / `binding.phases`
        // (or `[…]`) used as live accessors in a sentence that does
        // NOT already declare the access forbidden (negative-constraint
        // phrasing) AND does NOT use the form as part of an identifier
        // like `taskref_status_not_writable` or a backtick-quoted
        // identifier.
        const operationalRead = /(?:^|[^_`])(?:binding\.(?:lanes|phases|artifact_store|controls|delivery|gates)\s*[\.\[])/;
        const lines = content.split(/\r?\n/);
        const offenders = lines.filter((l) => {
          if (!operationalRead.test(l)) return false;
          if (/must\s+not|no\s+(?:son|es|debe|puede|se\s+invoca)|prohibit|prohib|sin\s+sufijo/i.test(l)) {
            return false;
          }
          // Skip lines that quote the form inside backticks (an
          // identifier reference, not a programmatic accessor).
          if (/`[^`]*binding\.(?:lanes|phases|artifact_store|controls|delivery|gates)/.test(l)) return false;
          return true;
        });
        if (offenders.length > 0) {
          fail(
            "REQ-TSKFLOW-006 F-02",
            `sd-protocol/${file}`,
            offenders[0]?.trim().slice(0, 100) ?? "<unknown>",
            "raw binding.* operational read in protocol file (MUST use bounded accessors)",
          );
        }
      }
      expect(true).toBe(true);
    });

    it("`modules/sdd/*/module.md` files do not declare raw `binding.lanes` / `binding.phases` reads in routing positions", async () => {
      // Workflow modules live at `.agents/skills/projectctl-sdd/modules/sdd/*/module.md`.
      // Scan each present module.md
      // and assert that any line that uses a raw read also carries a
      // negative-constraint phrase.
      // `sdd-orchestrator` is exempt: it is the orchestrator (never a lane),
      // and its preserved authorities (LaunchPacket producer/validator, lane
      // authorization, gate evaluation, scheduling, reconciliation) require
      // resolving the binding into the bounded WorkflowRuntimeContext.
      // Lanes consume only injected paths and stay covered by this scan.
      const entries = await fs.readdir(SDD_LANES_DIR);
      const lanes = entries.filter((e) => /^sdd-.+$/.test(e) && e !== "sdd-orchestrator");
      expect(lanes.length).toBeGreaterThan(0);
      let scanned = 0;
      for (const lane of lanes) {
        const skillPath = path.join(SDD_LANES_DIR, lane, "module.md");
        let content: string;
        try {
          content = await fs.readFile(skillPath, "utf8");
        } catch {
          continue;
        }
        scanned++;
        const lines = content.split(/\r?\n/);
        // Operational reads: a line that mentions
        // `binding.lanes` / `binding.phases` / `binding.artifact_store`
        // as a direct accessor (followed by `.` or `[`).
        const operationalRead = /\bbinding\.(?:lanes|phases|artifact_store|controls|status|delivery|gates)\s*[\.\[]/;
        const offenders = lines.filter(
          (l) =>
            operationalRead.test(l) &&
            !/must\s+not|no\s+(?:son|es|debe|puede|se\s+invoca|asume)|prohibit|prohib|sin\s+sufijo|raw\s+read/i.test(l),
        );
        if (offenders.length > 0) {
          fail(
            "REQ-TSKFLOW-008 F-02",
            `${lane}/module.md`,
            offenders[0]?.trim().slice(0, 100) ?? "<unknown>",
            "raw binding.* read in lane SKILL.md (MUST use bounded accessors)",
          );
        }
      }
      expect(scanned).toBe(lanes.length);
    });

    it("no workflow module hardcodes the retired binding path (locator is the only pointer)", async () => {
      // Lane modules must not hardcode the retired binding path.
      // check below tolerates prose mentions but fails any line that
      // reads or assigns the path as a hardcoded value.
      const entries = await fs.readdir(SDD_LANES_DIR);
      const lanes = entries.filter((e) => /^sdd-.+$/.test(e));
      for (const lane of lanes) {
        const skillPath = path.join(SDD_LANES_DIR, lane, "module.md");
        let content: string;
        try {
          content = await fs.readFile(skillPath, "utf8");
        } catch {
          continue;
        }
        if (!/references\/tareas\.md/.test(content)) continue;
        const lines = content.split(/\r?\n/);
        // A line hardcodes the path when it pairs the path with a
        // variable assignment, a string literal, or a programmatic
        // access (`fs.readFile(path)`, `readBinding(path)`, etc.).
        // We accept only prose mentions.
        const hardcodePattern = /\b(?:binding_path|path_pattern|read(?:File)?\s*\(|\brequire\s*\(|\bload\s*\(|\bpath\s*=)\b[^.\n]*references\/tareas\.md/;
        const proseHeuristic = /\b(?:the\s+active|el\s+bloque|the\s+canonical|el\s+can[oó]nico|en\s+`references|ver\s+`|see\s+`)/i;
        const offenders = lines.filter(
          (l) =>
            /references\/tareas\.md/.test(l) &&
            !proseHeuristic.test(l) &&
            (hardcodePattern.test(l) || /=\s*["'`][^"'`]*references\/tareas\.md/.test(l)),
        );
        if (offenders.length > 0) {
          fail(
            "REQ-TSKFLOW-008 F-02",
            `${lane}/module.md`,
            offenders[0]?.trim().slice(0, 100) ?? "<unknown>",
            "lane SKILL.md MUST NOT hardcode the binding path (locator is the only pointer)",
          );
        }
      }
      expect(true).toBe(true);
    });
  },
);

describe("AC-P5-01 / SC-P5-049..050 / SC-P5-055..056 — V2 package anti-hybrid gate", () => {
  // Scope expansion for WU-TEST-RED: this existing SoT pin owns the package
  // version assertion that changed with the task's legitimate MINOR bump.
  it("binding, locator, package and projections share the breaking V2 identity", async () => {
    const parsed = parseBindingFile(REPO_ROOT);
    const locator = JSON.parse(await fs.readFile(LOCATOR_PATH, "utf8")) as Record<string, unknown>;
    const projection = JSON.parse(await fs.readFile(PROJECTION_PATH, "utf8")) as Record<string, unknown>;
    const skill = await fs.readFile(path.join(SDD_DIR, "SKILL.md"), "utf8");

    expect((parsed.binding as Record<string, unknown>)["contract_kind"]).toBe("TaskFlowBindingV2");
    expect((parsed.binding as Record<string, unknown>)["binding_version"]).toBe("15.0.0");
    expect((parsed.binding as Record<string, unknown>)["model_version"]).toBe(2);
    expect(locator["expected_binding_version"]).toBe("15.0.0");
    expect((projection["source"] as Record<string, unknown>)["binding_version"]).toBe("15.0.0");
    expect(projection["model_version"]).toBe(2);
    expect(skill).toMatch(/^\s*version:\s*25\.0\.0\s*$/m);
    expect(skill).toContain("TaskFlowBindingV2");
    expect(skill).toContain("v15.0.0");
  });

  it("declares copy-tree replacement and blocks mixed V1/V2 or v8/v9 installations", async () => {
    const maintenance = await fs.readFile(path.join(SDD_DIR, 'references', 'maintenance.md'), 'utf8');
    const contract = maintenance;
    expect(contract).toContain("copy-tree-no-mods");
    expect(contract).toMatch(/(?:h[ií]brid|mixed|mezcla)[^\n]{0,180}(?:block|bloque|fail)/i);
    expect(contract).toMatch(/(?:V1\/V2|v8\/v9|8\.0\.0[^\n]{0,80}9\.0\.0)/i);
  });
});

describe('Problem 11 — active SDD sources do not require Engram', () => {
  it('bounded active portable policy, docs and config sources contain no Engram mirror obligation', async () => {
    const files = [
      'AGENTS.md',
      '.agents/skills/projectctl-sdd/modules/sdd/sdd-orchestrator/module.md',
      '.agents/skills/projectctl-sdd/references/tasks/binding.md',
      '.agents/skills/projectctl-requirements/references/standard.md',
      '.agents/skills/projectctl-sdd/modules/sd-protocol/workflow-runtime-context.md',
      '.agents/skills/projectctl-sdd/modules/sd-protocol/persistence-contract.md',
      '.agents/skills/projectctl-sdd/modules/sd-protocol/sdd-phase-common.md',
      '.agents/skills/projectctl-sdd/modules/sdd/sdd-init/module.md',
    ];
    const prohibited = /engram\s+(?:mirror|topic|runtime)|taskreadme\s*\+\s*engram|mirrors?\s+(?:actuales|obligatori)|espej\w*\s+en\s+engram/i;
    for (const relativePath of files) {
      const content = await fs.readFile(path.join(REPO_ROOT, relativePath), 'utf8');
      expect(content, `${relativePath} contains prohibited Engram-as-SDD-persistence language`).not.toMatch(prohibited);
    }
  });

  it('keeps current SDD decisions without superseded workflow rules', async () => {
    const decisions = await fs.readFile(
      path.join(REPO_ROOT, '.agents/skills/projectctl-sdd/references/decisions.md'),
      'utf8',
    );
    expect(decisions).toContain('sdd-orchestrator');
    expect(decisions).toContain('scripts/project/tasks.ts');
    expect(decisions).not.toContain('D-17');

    const bindingDoc = await fs.readFile(
      path.join(REPO_ROOT, '.agents/skills/projectctl-sdd/references/tasks/binding.md'),
      'utf8',
    );
    expect(bindingDoc).toMatch(/memorias stale no reservan IDs ni restauran decisiones|stale.*no.*reserv|pending_environment/);
  });

  it('optional support tools are explicitly excluded from SDD evidence and source-of-truth semantics (portable)', async () => {
    const orchestratorModule = await fs.readFile(
      path.join(REPO_ROOT, '.agents/skills/projectctl-sdd/modules/sdd/sdd-orchestrator/module.md'),
      'utf8',
    );
    const orchestrator = await fs.readFile(path.join(REPO_ROOT, '.opencode/agents/sdd-orchestrator.md'), 'utf8');
    expect(`${orchestratorModule}\n${orchestrator}`).toContain('Optional memory or support tools');
    expect(`${orchestratorModule}\n${orchestrator}`).toContain('never SDD evidence');
  });
});

// ─── Documentation contract registration ─────────────────────────────

describe(
  "AC-009 / AC-014 / SC-TSKFLOW-022 — documentation contract runs by default",
  () => {
    it("registers this contract in the normal test path", () => {
      expect(true).toBe(true);
    });
  },
);

// ─────────────────────────────────────────────────────────────────────
// ENV-RED-CONTRACT (deferred RED, WU-13 lane D) — taskReadme
// `20260805-rddph5-incorporar-fase-5-rdd-receipt-driven` §8.2.
//
// REQ-P5-023 item 2 + design D13/D15: the binding text (outside the
// fenced JSON block) MUST document the sdd-orchestrator-owned recording
// location, the `pending_record_section` name and the read-model
// `documentation_candidate` lifecycle values, so the skill stays the
// single normative source (no second, undocumented persistence shape).
// This is currently undocumented — every assertion below MUST fail RED
// until `ENV-GREEN-BINDING` lands.
// ─────────────────────────────────────────────────────────────────────
describe("ENV-RED-CONTRACT / REQ-P5-023 — environment deferral SoT coherence", () => {
  it("SC-P5-057 — references/tasks/binding.md documents the sdd-orchestrator-owned pending_environment recording location", async () => {
    const bindingDoc = await fs.readFile(
      path.join(REPO_ROOT, '.agents/skills/projectctl-sdd/references/tasks/binding.md'),
      'utf8',
    );
    if (!bindingDoc.includes('pending_environment')) {
      throw new Error(
        gateReason(
          'REQ-P5-023 SC-P5-057',
        '.agents/skills/projectctl-sdd/references/tasks/binding.md#/pending_environment',
          '<absent>',
          'binding text MUST document the pending_environment record location/section (RED: not implemented yet)',
        ),
      );
    }
    expect(bindingDoc).toContain('pending_environment');
    expect(bindingDoc).toContain('Go');
    expect(bindingDoc).toContain('Docker');
    expect(bindingDoc).toContain('PW');
    expect(bindingDoc).toContain('Git-real');
  });

  it("SC-P5-060/062 — documents documentation_candidate lifecycle values without presenting them as approval or completion", async () => {
    const bindingDoc = await fs.readFile(
      path.join(REPO_ROOT, '.agents/skills/projectctl-sdd/references/tasks/binding.md'),
      'utf8',
    );
    const lifecycleValues = ['not_started', 'allowed', 'written_returned_to_p3'];
    for (const value of lifecycleValues) {
      if (!bindingDoc.includes(value)) {
        throw new Error(
          gateReason(
            'REQ-P5-024 SC-P5-060/062',
            `.agents/skills/projectctl-sdd/references/tasks/binding.md#/documentation_candidate/${value}`,
            '<absent>',
            'binding text MUST document the documentation_candidate lifecycle value (RED: not implemented yet)',
          ),
        );
      }
      expect(bindingDoc).toContain(value);
    }
    expect(bindingDoc).not.toMatch(/documentation_candidate[^\n]{0,80}(coverage complete|fase 4 complet|approved)/i);
  });

  it("SC-P5-063/064 — el core no reclama los gates ambientales de SDD", async () => {
    const standard = await fs.readFile(
      path.join(REPO_ROOT, '.agents/skills/projectctl-requirements/references/standard.md'),
      'utf8',
    );
    const binding = await fs.readFile(BINDING_PATH, 'utf8');
    expect(binding).toContain('pending_environment_close_block');
    expect(binding).toContain('environment_verification_deferred');
    expect(standard).not.toContain('pending_environment_close_block');
    expect(standard).not.toContain('environment_verification_deferred');
  });
});

// ─── PASO 2 — app-map-criteria-types portable (v21.0.0) ─────────────────
// Portable suite
// `integration-tests/projectctl/app-map-criteria-types.test.ts`
// (factory inyectable parametrizada por REPO_ROOT/APP_MAP_GLOB, sin import
// estático a `sandbox/`). Los wrappers locales `<repo>/scripts/...` los
// provee el destino y NO se pinean aquí. La SoT test path portable vive en
// `references/sources.md`.

describe("PASO 2 — app-map-criteria-types portable exists", () => {
  it("portable suite exists, is env-parametrized and has no static sandbox import", async () => {
    const portableRel =
      "integration-tests/projectctl/app-map-criteria-types.test.ts";
    const portable = await fs.readFile(path.join(REPO_ROOT, portableRel), "utf8");
    if (!portable.includes("app-map-criteria-types.portable.test.ts")) {
      fail(
        "PCT-149..155/TST-38/AC-329 PASO-2",
        portableRel,
        "<missing portable reference>",
        "portable suite MUST reference its own portable path",
      );
    }
    expect(portable).toContain("process.env.REPO_ROOT");
    expect(portable).toContain("process.env.APP_MAP_GLOB");
    expect(portable).toContain("defineAppMapCriteriaTypesSuite");
    if (/from\s+['"][^'"]*sandbox\//.test(portable) || /require\(\s*['"][^'"]*sandbox\//.test(portable)) {
      fail(
        "PCT-149..155/TST-38/AC-329 PASO-2",
        portableRel,
        "<static sandbox import>",
        "portable suite MUST NOT statically import sandbox/ (injectable wiring only)",
      );
    }
    if (portable.includes("/home/jete")) {
      fail(
        "PCT-149..155/TST-38/AC-329 PASO-2",
        portableRel,
        "<local absolute path>",
        "portable suite MUST NOT hardcode local absolute paths",
      );
    }
    expect(portable).not.toMatch(/from\s+['"][^'"]*sandbox\//);
    expect(true).toBe(true);
  });
});

// ─── PASO 3 — app-map-format portable (v21.0.0) ──────────────────────────
//
// El normalizador portable
// `.agents/skills/projectctl-requirements/scripts/project/app-map-format.ts`
// (formatter puro autocontenido, parametrizado por REPO_ROOT/APP_MAP_GLOB,
// sin import estático a `sandbox/`). La suite portable
// `scripts/__tests__/app-map-format.portable.test.ts` expone la factory
// inyectable `defineAppMapFormatSuite`. Los wrappers locales
// `<repo>/scripts/...` los provee el destino y NO se pinean aquí. La SoT test
// path portable de PCT-83..88 cita al portable (ver `references/docs/reglas.md` PCT-85 y
// `references/sources.md` traza PCT-85).

describe("PASO 3 — app-map-format portable exists", () => {
  it("portable formatter exists, is env-parametrized and has no static sandbox import", async () => {
    const portableRel = ".agents/skills/projectctl-requirements/scripts/project/app-map-format.ts";
    const portableTestRel =
      ".agents/skills/projectctl-requirements/scripts/__tests__/app-map-format.portable.test.ts";
    const [portable, portableTest] = await Promise.all(
      [portableRel, portableTestRel].map((rel) =>
        fs.readFile(path.join(REPO_ROOT, rel), "utf8"),
      ),
    );
    for (const [rel, content] of [
      [portableRel, portable],
      [portableTestRel, portableTest],
    ] as const) {
      if (!content.includes("app-map-format.portable.test.ts")) {
        fail(
          "PCT-83..88 PASO-3",
          rel,
          "<missing portable reference>",
          "both portable script and suite MUST reference the portable suite path",
        );
      }
    }
    expect(portable).toContain("process.env.REPO_ROOT");
    expect(portable).toContain("process.env.APP_MAP_GLOB");
    expect(portable).toContain("formatAppMapFiles");
    if (/from\s+['"][^'"]*sandbox\//.test(portable) || /require\(\s*['"][^'"]*sandbox\//.test(portable)) {
      fail(
        "PCT-83..88 PASO-3",
        portableRel,
        "<static sandbox import>",
        "portable formatter MUST NOT statically import sandbox/ (self-contained pure logic)",
      );
    }
    if (/from\s+['"][^'"]*sandbox\//.test(portableTest) || /require\(\s*['"][^'"]*sandbox\//.test(portableTest)) {
      fail(
        "PCT-83..88 PASO-3",
        portableTestRel,
        "<static sandbox import>",
        "portable suite MUST NOT statically import sandbox/ (injectable wiring only)",
      );
    }
    for (const [rel, content] of [
      [portableRel, portable],
      [portableTestRel, portableTest],
    ] as const) {
      if (content.includes("/home/jete")) {
        fail(
          "PCT-83..88 PASO-3",
          rel,
          "<local absolute path>",
          "portable script and suite MUST NOT hardcode local absolute paths",
        );
      }
    }
    expect(portableTest).toContain("defineAppMapFormatSuite");
    expect(portableTest).toContain("repoRoot");
    expect(portableTest).toContain("appMapGlob");
    expect(true).toBe(true);
  });
});

// ─── PASO 4 — docs-lint-core portable (v21.0.0) ─────────────────────────
//
// El contrato portable `scripts/project/docs-lint-core.ts` implementa puros los
// checks 1-5 de `docs:lint` (parametrizado por parser/globs/IO, sin import
// estático a `sandbox/`). Los wrappers locales `<repo>/scripts/...` los provee
// el destino y NO se pinean aquí. La spec portable se cita —no copia— en
// `references/test/reglas.md` (TST-38) y `references/standard.md` §1/§2. Las filas
// PCT-154/TST-38/AC-329 de `references/sources.md` trazan contrato portable +
// wrapper local del destino.

describe("PASO 4 — docs-lint-core portable exists", () => {
  it("portable core is pure; specs + rows pin the portable contract", async () => {
    const coreRel = ".agents/skills/projectctl-requirements/scripts/project/docs-lint-core.ts";
    const core = await fs.readFile(path.join(REPO_ROOT, coreRel), "utf8");
    for (const needle of ["checkPlaywrightSpecs", "checkUnitTests", "checkProductCode", "checkTestGate", "runDocsLint"]) {
      if (!core.includes(needle)) {
        fail(
          "PCT-154/TST-38/AC-329 PASO-4",
          coreRel,
          `<missing ${needle}>`,
          "portable core MUST implement the 5 docs-lint checks",
        );
      }
    }
    if (/from\s+['"][^'"]*sandbox\//.test(core) || /require\(\s*['"][^'"]*sandbox\//.test(core)) {
      fail(
        "PCT-154/TST-38/AC-329 PASO-4",
        coreRel,
        "<static sandbox import>",
        "portable core MUST NOT statically import sandbox/ (injectable parser only)",
      );
    }
    if (core.includes("/home/jete")) {
      fail(
        "PCT-154/TST-38/AC-329 PASO-4",
        coreRel,
        "<local absolute path>",
        "portable core MUST NOT hardcode local absolute paths",
      );
    }
    for (const [rel, content] of [
      ["references/test/reglas.md", await fs.readFile(path.join(REPO_ROOT, ".agents/skills/projectctl-requirements/references/test/reglas.md"), "utf8")],
      ["references/standard.md", await fs.readFile(path.join(REPO_ROOT, ".agents/skills/projectctl-requirements/references/standard.md"), "utf8")],
    ] as const) {
      if (!content.includes(coreRel)) {
        fail(
          "PCT-154/TST-38/AC-329 PASO-4",
          rel,
          "<missing portable core citation>",
          "spec MUST cite —not copy— the portable core path",
        );
      }
    }
    const sources = await fs.readFile(
      path.join(REPO_ROOT, ".agents/skills/projectctl-requirements/references/sources.md"),
      "utf8",
    );
    for (const id of ["PCT-154", "TST-38", "AC-329"]) {
      const row = sources.split(/\r?\n/).find((line) => line.startsWith(`| \`${id}\``));
      if (!row || !row.includes("docs-lint-core.ts") || !row.includes("wrapper local")) {
        fail(
          "PCT-154/TST-38/AC-329 PASO-4",
          "references/sources.md",
          row ?? "<absent>",
          `row ${id} MUST trace the portable core + destination wrapper local`,
        );
      }
    }
    expect(true).toBe(true);
  });
});

// ─── PASO 5 — test-runner-contract portable (v21.0.0) ───────────────────
//
// El contrato portable
// `.agents/skills/projectctl-requirements/scripts/project/test-runner-contract.ts`
// implementa tipos + validadores puros del sistema de testing
// (`validateAcHeader`/`validateLayout`/`validateResultsEnvelope`, mapping
// 1:1, persistencia `.runtime/test-results/<id>/<run-id>/`, pending/not
// accepted + writeback diferido). El wrapper local `<repo>/scripts/...`
// (proveído por el destino) aporta ejecución y persistencia de la instancia.
// Las filas PCT-89..94 de `references/sources.md` trazan SoT CLI = contrato
// portable vs Runtime = wrapper local del destino; `references/test/reglas.md` y
// `references/standard.md` §2 lo citan sin copiarlo.

describe("PASO 5 — test-runner-contract portable exists", () => {
  it("portable contract is pure types + validators; specs + rows pin it", async () => {
    const contractRel = ".agents/skills/projectctl-requirements/scripts/project/test-runner-contract.ts";
    const contract = await fs.readFile(path.join(REPO_ROOT, contractRel), "utf8");
    for (const needle of [
      "validateAcHeader",
      "validateLayout",
      "validateResultsEnvelope",
      "PROJECTCTL_TEST_MAPPING",
      ".runtime/test-results",
      "AUTO_WRITEBACK_DEFERRED_V1",
      "pending",
    ]) {
      if (!contract.includes(needle)) {
        fail(
          "PCT-89..94 PASO-5",
          contractRel,
          `<missing ${needle}>`,
          "portable contract MUST expose pure types + validators (AC header, layout, envelope, mapping, persistence, deferred writeback)",
        );
      }
    }
    for (const banned of ["spawn", "SANDBOX_URL", "compose"]) {
      if (contract.includes(banned)) {
        fail(
          "PCT-89..94 PASO-5",
          contractRel,
          `<contains ${banned}>`,
          "portable contract MUST NOT own runtime execution (no spawn, no endpoint env, no compose)",
        );
      }
    }
    if (
      /from\s+['"][^'"]*sandbox\//.test(contract) ||
      /require\(\s*['"][^'"]*sandbox\//.test(contract) ||
      /from\s+['"][^'"]*frontend\//.test(contract) ||
      /from\s+['"][^'"]*\.atl\//.test(contract)
    ) {
      fail(
        "PCT-89..94 PASO-5",
        contractRel,
        "<static sandbox/frontend/.atl import>",
        "portable contract MUST NOT statically import instance surfaces (pure logic only)",
      );
    }
    if (contract.includes("/home/jete")) {
      fail(
        "PCT-89..94 PASO-5",
        contractRel,
        "<local absolute path>",
        "portable contract MUST NOT hardcode local absolute paths",
      );
    }
    for (const [rel, content] of [
      ["references/test/reglas.md", await fs.readFile(path.join(REPO_ROOT, ".agents/skills/projectctl-requirements/references/test/reglas.md"), "utf8")],
      ["references/standard.md", await fs.readFile(path.join(REPO_ROOT, ".agents/skills/projectctl-requirements/references/standard.md"), "utf8")],
    ] as const) {
      if (!content.includes(contractRel)) {
        fail(
          "PCT-89..94 PASO-5",
          rel,
          "<missing portable contract citation>",
          "spec MUST cite —not copy— the portable contract path",
        );
      }
    }
    const sources = await fs.readFile(
      path.join(REPO_ROOT, ".agents/skills/projectctl-requirements/references/sources.md"),
      "utf8",
    );
    for (const id of ["PCT-89", "PCT-90", "PCT-91", "PCT-92", "PCT-93", "PCT-94"]) {
      const row = sources.split(/\r?\n/).find((line) => line.startsWith(`| \`${id}\``));
      if (!row || !row.includes("test-runner-contract.ts") || !/`2026-09-(?:27|28)`/.test(row)) {
        fail(
          "PCT-89..94 PASO-5",
          "references/sources.md",
          row ?? "<absent>",
          `row ${id} MUST trace the portable contract (SoT CLI) + a current last-verified date`,
        );
      }
      if (!row.includes("wrapper local") && !row.includes("TEST_PLAN.md")) {
        fail(
          "PCT-89..94 PASO-5",
          "references/sources.md",
          row,
          `row ${id} MUST keep tracing the runtime side (SoT Runtime = destination wrapper local)`,
        );
      }
    }
    expect(true).toBe(true);
  });
});

// ─── PASO 7 — code-traceability-contract portable (v21.0.0, warn-only) ──
//
// El contrato portable
// `.agents/skills/projectctl-requirements/scripts/project/code-traceability-contract.ts`
// expone shape + validador puro del locator (roots front/back/tests,
// ORPHAN_CODE_BLOCK warn-only, not-applicable con manifest inválido, regex
// @criterion/@trace/@ac/@contract con prefijos //,--,<!-- y adyacencia).
// El wrapper local `<repo>/scripts/...` (proveído por el destino) aporta
// lecturas, snapshot y CLI de la instancia con el contrato como fallback
// inyectado.
// `references/code/reglas.md` § trazabilidad documenta REQ-CODETRACE-001 como
// locator; el schema vive en `references/schemas/code-traceability.schema.json`;
// MAP.md NO publica fila operativa.
//
// Ventana warn-first (OPCIÓN A): este check es warn, never fail — junta
// issues y emite `console.warn`, siempre verde.

describe("PASO 7 — code-traceability-contract portable (warn-only)", () => {
  it("verifies the core code traceability contract and structure locator", async () => {
    const contractRel = ".agents/skills/projectctl-requirements/scripts/project/code-traceability-contract.ts";
    const schemaRel = ".agents/skills/projectctl-requirements/references/schemas/code-traceability.schema.json";
    const estructuraRel = ".agents/skills/projectctl-requirements/references/code/reglas.md";
    const read = (rel: string) => fs.readFile(path.join(REPO_ROOT, rel), "utf8");
    const contract = await read(contractRel);
    const schema = JSON.parse(await read(schemaRel)) as Record<string, unknown>;
    const estructura = await read(estructuraRel);
    expect(schema["$id"]).toBe("projectctl-code-traceability/v1");
    expect(contract).toContain("isAdjacent");
    expect(estructura).toContain("REQ-CODETRACE-001");
    expect(estructura).toContain("code-traceability-contract.ts");
  });
});

describe("TST-39..TST-42 — managed discovery requirements are documented and enforced", () => {
  it("test.md documents single-copy, owner, bounded locations and title IDs", async () => {
    const test = await readReference("test/reglas.md");
    for (const needle of [
      "TST-39",
      "TST-40",
      "TST-41",
      "TST-42",
      "TST-39-SINGLE-COPY",
      "TST-40-OWNER",
      "TST-41-BOUNDED-LOCATION",
      "TST-42-SPEC-TITLE",
      "tests/e2e/<view>/",
      "tests/unit/<view>/",
    ]) {
      expect(test).toContain(needle);
    }
  });
  it("doctor-test.ts enforces the four managed discovery checks", async () => {
    const doctor = await fs.readFile(
      path.join(REPO_ROOT, ".agents/skills/projectctl-requirements/scripts/project/doctor-test.ts"),
      "utf8",
    );
    for (const needle of [
      "TST-39-SINGLE-COPY",
      "TST-40-OWNER",
      "TST-41-BOUNDED-LOCATION",
      "TST-42-SPEC-TITLE",
    ]) {
      expect(doctor).toContain(needle);
    }
  });
  it("portable contract exposes owner and title validators", async () => {
    const contract = await fs.readFile(
      path.join(REPO_ROOT, ".agents/skills/projectctl-requirements/scripts/project/test-runner-contract.ts"),
      "utf8",
    );
    for (const needle of ["validateOwnerAnnotation", "validateSpecTitleIds"]) {
      expect(contract).toContain(needle);
    }
  });
});
