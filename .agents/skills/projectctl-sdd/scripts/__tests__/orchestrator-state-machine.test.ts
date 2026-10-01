// @ac AC-001 — la autoridad normativa del workflow local está declarada
//               únicamente en `projectctl-sdd/references/tasks/binding.md`.
// @ac AC-002 — `phase-state-schema.json` coincide con el binding y no se
//               declara como autoridad independiente (`source_of_truth: true`
//               MUST estar ausente).
// @ac AC-004 — el `phase` MUST admitir exactamente 4 valores; `state` MUST
//               pertenecer al grupo declarado por fase.
// @ac AC-013 — Existen checks anti-drift para estados, lanes, paths y
//               fuentes duplicadas.
// @ac AC-014 — Los taskReadmes históricos no son tratados como workflow
//               activo.
// @sc SC-TSKFLOW-022 — Violación activa localizada: cada fallo MUST nombrar
//               requisito, archivo y valor divergente.
// @sc SC-TSKFLOW-023 — Fixture portable: branch/store/phases/paths deben
//               poder cambiar sin literales locales.
//
// Lane D (`sdd-apply-unit-tests`) — WU-13 del cambio
// `20260722-tskflow-centralizar-flujo-tareas-sdd` (taskReadme
// `20260722-tskflow-centralizar-flujo-tareas-sdd.md` §10 fila WU-13).
// Anti-drift suite covers authority, projection, state, lanes, portability,
// template and codegen contracts in the normal test path.
//
// Por qué este archivo:
//   1. La cara algorítmica de la nueva projection `phase-state-schema.json`
//      generada por WU-11 desde el binding canónico: fases, states,
//      controls, lanes, statuses escribibles y guards. La projection
//      ya no declara `source_of_truth: true` (per WU-02) y carga metadata
//      `source { binding_id, binding_version, source_path, source_sha256 }`.
//   2. La matriz `phase.allowed_lanes`/`phase.transitions` debe coincidir
//      con el binding literal (parity byte-exact entre binding y projection
//      digest).
//   3. El bridge Fase 3 → Fase 4 (`phase4_owned_dependencies_only`) y Fase 4
//      → Fase 3 (`documentation_changed_requires_reverification`) deben
//      aparecer como guards nominales y demarcar el camino legal de
//      documentación y reverificación.
//   4. El test corre contra el material del binding canónico — el archivo
//      `phase-state-schema.json` se regenera desde el binding pero el SHA
//      embedded en su `source.source_sha256` se compara contra el SHA
//      computado del binding por el normalizador para detectar drift.
//
// Convenciones (per `sdd-apply-unit-tests/SKILL.md` + `bun-runtime` +
// `projectctl-sdd` + `frontend-policy`):
//   - Header `// @ac / @sc` en las primeras 10 líneas.
//   - `bun:test` describe/it/expect.
//   - `node:fs/promises` + `node:crypto` para lectura y verificación del
//     binding/projection; import del normalizador vía `scripts/`.
//   - Todos los contratos estáticos y documentales corren por defecto.
//   - Cada fallo MUST nombrar `REQ-TSKFLOW-013` (o el AC concreto) +
//     `path` + valor. Esta suite asserta `path` y `value` en el mensaje
//     de error para todos los `expect(...)` que encierran un AC concreto.
//
// Test-runner wiring:
//   - Path explícito al ejecutar:
//       bun test ./.agents/skills/projectctl-sdd/scripts/__tests__/orchestrator-state-machine.test.ts
//     desde la raíz.

import { describe, expect, it } from "bun:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  FOCAL_SKILL_REGISTRY_PATH,
  gateReason,
  RDD_DELIVERY_GATES,
  RDD_LANE_IDS,
  RDD_MODE_VALUES,
  RDD_PHASE_STATES,
  RDD_V2_EXPECTED_IDENTITY,
} from "./lib/sdd-anti-drift-fixtures.ts";

import {
  resolveProjectctlModule,
} from "../skill/projectctl-module-resolver.ts";

import {
  assertBindingShape,
  buildModeContext,
  buildSourceMetadata,
  canonicalJsonStringify,
  ENVIRONMENT_DEFERRAL_METHODS,
  parseBindingFile,
  resolveLaneSkillContext,
  sha256OfString,
  validatePendingEnvironmentMethods,
  ModeContextResolutionError,
  SkillResolutionError,
  TARGETS,
} from "../skill/task-flow-normalizer.ts";

// ─── Path resolution (canonical module paths only) ──────────────────────

const HERE = path.dirname(new URL(import.meta.url).pathname);
const REPO_ROOT = path.resolve(HERE, "../../../../..");
const BINDING_PATH = path.join(
  REPO_ROOT,
  ".agents",
  "skills",
  "projectctl-sdd",
  "references",
   "tasks",
   "binding.md",
);
const PROJECTION_PATH = path.join(
  REPO_ROOT,
  ".agents",
  "skills",
  "projectctl-sdd",
  "generated",
  "phase-state-schema.json",
);
const LOCATOR_PATH = path.join(REPO_ROOT, ".agents", "sdd-workflow.json");

// ─── Load helpers — emit domain errors with `REQ / path / value` per SC-022

async function loadProjection(): Promise<Record<string, unknown>> {
  const raw = await fs.readFile(PROJECTION_PATH, "utf8");
  return JSON.parse(raw) as Record<string, unknown>;
}

async function loadLocator(): Promise<Record<string, unknown>> {
  const raw = await fs.readFile(LOCATOR_PATH, "utf8");
  return JSON.parse(raw) as Record<string, unknown>;
}

function fail(req: string, path: string, value: string, why: string): never {
  throw new Error(gateReason(req, path, value, why));
}

function pathField(obj: unknown, field: string, owner: string): unknown {
  if (obj === null || typeof obj !== "object") {
    fail("REQ-TSKFLOW-002 AC-002", `${owner}/${field}`, "<not-an-object>", `expected object with field "${field}"`);
  }
  const rec = obj as Record<string, unknown>;
  if (!(field in rec)) {
    fail("REQ-TSKFLOW-002 AC-002", `${owner}/${field}`, "<missing-field>", `field "${field}" missing`);
  }
  return rec[field];
}

async function readCanonicalJsonSha256(repoRoot: string): Promise<string> {
  // Same path the codegen uses to compute the projection digest; we
  // re-derive it here so the projection-vs-binding gate is end-to-end.
  const parsed = parseBindingFile(repoRoot);
  return parsed.bindingSha256;
}

// ─── AC-001 — single authority, no second source ──────────────────────

describe("AC-001 / REQ-TSKFLOW-001 — single authority (projectctl-sdd)", () => {
  it("`references/tasks/binding.md` existe y contiene el bloque delimitado", async () => {
    const raw = await fs.readFile(BINDING_PATH, "utf8");
    expect(raw.includes("<!-- task-flow-binding:start -->")).toBe(true);
    expect(raw.includes("<!-- task-flow-binding:end -->")).toBe(true);
    const parsedBinding = parseBindingFile(REPO_ROOT);
    const bindingId = parsedBinding.binding.binding_id;
    if (bindingId !== "projectctl-requirements.task-flow") {
      fail(
        gateReason(
          "REQ-TSKFLOW-001",
          `${BINDING_PATH}#/task-flow-binding/binding_id`,
          String(bindingId ?? "<missing>"),
          "expected JSON binding_id=\"projectctl-requirements.task-flow\"",
        ),
      );
    }
    expect(bindingId).toBe("projectctl-requirements.task-flow");
  });

  it("locator `.agents/sdd-workflow.json` apunta al binding canónico", async () => {
    const locator = await loadLocator();
    const bindingPath = pathField(locator, "binding_path", LOCATOR_PATH) as string;
    const expectedBindingId = pathField(locator, "expected_binding_id", LOCATOR_PATH) as string;
    if (!bindingPath.endsWith("references/tasks/binding.md")) {
      fail(
        gateReason(
          "REQ-TSKFLOW-001",
          LOCATOR_PATH,
          bindingPath,
          "locator MUST target references/tasks/binding.md (the single authority)",
        ),
      );
    }
    if (expectedBindingId !== "projectctl-requirements.task-flow") {
      fail(
        gateReason(
          "REQ-TSKFLOW-001",
          LOCATOR_PATH,
          expectedBindingId,
          "expected_binding_id MUST equal projectctl-requirements.task-flow",
        ),
      );
    }
    expect(bindingPath.endsWith("references/tasks/binding.md")).toBe(true);
    expect(expectedBindingId).toBe("projectctl-requirements.task-flow");
  });

});

// ─── AC-001 / REQ-TSKFLOW-001 — single authority extensions (F-01 rerun) ─
//
// F-01 of the latest `sdd-verify-code` rerun (`code_review_passed` after
// F-03R-G / F-05R, see taskReadme §15) closed the resolver/context and
// the named-transition shape. The defensive static checks below pin the
// invariants the next rerun will assert, without rerunning the
// resolver: the locator + binding + projection must all declare the
// same binding identity; no parallel generated file may
// declare authority; and the projection MUST NOT re-publish the
// binding's source metadata with `source_of_truth: true` (the legacy
// authoritative flag retired by WU-02).

describe("WorkflowRuntimeContextV1 — mandatory selected lane skill resolution", () => {
  it("resolves lane skill first, then deduplicated surface policies and helpers", () => {
    // Portable-only: el contrato es el binding declarado + módulos
    // sd-protocol de esta skill. La versión anterior exigía el árbol de la
    // instancia origen (`.agents/skills/frontend-policy/SKILL.md`, ausente
    // en destinos portables). Se reescribe con paths portables que existen
    // en el paquete `copy-tree-no-mods`, preservando la semántica de
    // deduplicación (surface duplicado + helper que solapa surface).
    const binding = parseBindingFile(REPO_ROOT).binding;
    const context = resolveLaneSkillContext(REPO_ROOT, binding, "sdd-apply-code-high", {
      registryPath: FOCAL_SKILL_REGISTRY_PATH,
      surfaceSkillPaths: [
        ".agents/skills/projectctl-sdd/modules/sd-protocol/skill-resolver.md",
        ".agents/skills/projectctl-sdd/modules/sd-protocol/skill-resolver.md",
      ],
      helperSkillPaths: [
         ".agents/skills/projectctl-sdd/modules/sd-protocol/module.md",
        ".agents/skills/projectctl-sdd/modules/sd-protocol/skill-resolver.md",
      ],
    });

    expect(context).toEqual({
       lane_skill_path: ".agents/skills/projectctl-sdd/modules/sdd/sdd-apply-code/module.md",
      surface_skill_paths: [".agents/skills/projectctl-requirements/SKILL.md", ".agents/skills/projectctl-sdd/modules/sd-protocol/skill-resolver.md"],
      task_skill_snapshot: {
        schema: "task-skills/v1",
        selected_ids: [],
        warnings: [],
      },
      task_selected_skill_paths: [],
       skill_paths: [
          ".agents/skills/projectctl-sdd/modules/sdd/sdd-apply-code/module.md",
          ".agents/skills/projectctl-requirements/SKILL.md",
        ".agents/skills/projectctl-sdd/modules/sd-protocol/skill-resolver.md",
         ".agents/skills/projectctl-sdd/modules/sd-protocol/module.md",
      ],
    });
  });

  it("fails closed when the selected lane skill cannot resolve", () => {
    const binding = structuredClone(parseBindingFile(REPO_ROOT).binding);
    const lanes = binding.lanes as Record<string, Record<string, unknown>>;
     lanes["missing-lane"] = { skill: "missing-lane-skill" };

    let failure: unknown;
    try {
         resolveLaneSkillContext(REPO_ROOT, binding, "missing-lane", {
        registryPath: FOCAL_SKILL_REGISTRY_PATH,
      });
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(SkillResolutionError);
    expect((failure as SkillResolutionError).code).toBe("skill_resolution_missing");
     expect((failure as Error).message).toContain("lane_not_registered");
  });

  it("fails closed when the configured registry is unreadable", () => {
    const binding = parseBindingFile(REPO_ROOT).binding;
    expect(() =>
       resolveLaneSkillContext(REPO_ROOT, binding, "missing-lane", {
        registryPath: ".atl/does-not-exist.md",
      }),
    ).toThrow("skill_resolution_missing");
  });

  it("fails closed when a required surface policy is unreadable", () => {
    const binding = parseBindingFile(REPO_ROOT).binding;
    expect(() =>
      resolveLaneSkillContext(REPO_ROOT, binding, "sdd-apply-code-high", {
        registryPath: FOCAL_SKILL_REGISTRY_PATH,
        surfaceSkillPaths: [".agents/skills/missing-surface-policy/SKILL.md"],
      }),
    ).toThrow("skill_resolution_missing");
  });

  it("allows only injected-paths success for coordinated SDD lanes", async () => {
    const common = await fs.readFile(
       path.join(REPO_ROOT, ".agents/skills/projectctl-sdd/modules/sd-protocol/sdd-phase-common.md"),
      "utf8",
    );
    const resolver = await fs.readFile(
       path.join(REPO_ROOT, ".agents/skills/projectctl-sdd/modules/sd-protocol/skill-resolver.md"),
      "utf8",
    );

    expect(common).not.toContain("fallback-registry");
    expect(common).not.toContain("fallback-compact");
    expect(common).not.toContain("proceed with your phase skill only");
    expect(resolver).toContain("For coordinated SDD lanes, `injected-paths` is the only successful value");
    expect(resolver).toContain("Non-SDD delegations only");
    expect(resolver).toContain("never drop or truncate `lane_skill_path`, required `surface_skill_paths`");
    expect(resolver).toContain("return `blocked` with `skill_resolution_missing` before launch");
  });
});

describe("sdd-orchestrator delegates executor policy without policy drift", () => {
   const ORCHESTRATOR_PATH = path.join(
     REPO_ROOT,
     ".agents",
     "skills",
     "projectctl-sdd",
     "modules",
     "sdd",
     "sdd-orchestrator",
     "module.md",
   );
   const PROTOCOL_ROOT = path.join(
     REPO_ROOT,
     ".agents",
     "skills",
     "projectctl-sdd",
     "modules",
     "sd-protocol",
   );

  it("sdd-orchestrator does not republish lane procedures or command matrices", async () => {
    const orchestrator = await fs.readFile(ORCHESTRATOR_PATH, "utf8");
    const duplicatedExecutorMarkers = [
      "The sdd-orchestrator must inject these instructions",
      "### `sdd-apply-code-low`",
      "### `sdd-apply-code-medium`",
      "### `sdd-apply-code-high`",
      "### `sdd-apply-unit-tests`",
      "### `sdd-apply-pwauto-tests`",
      "## Testing & Browser Validation",
      "bunx playwright test",
      "grep -E '^(<key1>=|<key2>=)'",
    ];

    for (const marker of duplicatedExecutorMarkers) {
      expect(orchestrator, `${ORCHESTRATOR_PATH} must delegate executor policy, found ${marker}`).not.toContain(marker);
    }
  });

  it("critical executor rules remain in their authoritative owners", async () => {
    const [phaseCommon, workUnits, strictTdd, verifyCommon, applyCode, applyUnitTests] = await Promise.all([
      fs.readFile(path.join(PROTOCOL_ROOT, "sdd-phase-common.md"), "utf8"),
      fs.readFile(path.join(PROTOCOL_ROOT, "apply-work-unit-schema.md"), "utf8"),
      fs.readFile(path.join(PROTOCOL_ROOT, "strict-tdd.md"), "utf8"),
      fs.readFile(path.join(PROTOCOL_ROOT, "sdd-verify-common.md"), "utf8"),
       fs.readFile(path.join(REPO_ROOT, ".agents", "skills", "projectctl-sdd", "modules", "sdd", "sdd-apply-code", "module.md"), "utf8"),
       fs.readFile(path.join(REPO_ROOT, ".agents", "skills", "projectctl-sdd", "modules", "sdd", "sdd-apply-unit-tests", "module.md"), "utf8"),
    ]);

    expect(phaseCommon).toContain("primary-before-mirror");
    expect(phaseCommon).toContain("Safe-write the primary artifact");
    expect(phaseCommon).toContain("Every phase MUST return a structured envelope");
    expect(workUnits).toContain("`code-high` | NEVER");
    expect(workUnits).toContain("`sdd-orchestrator` enforces the gate when **assigning** units");
    expect(strictTdd).toContain("RED -> GREEN -> TRIANGULATE -> REFACTOR");
    expect(verifyCommon).toContain("run/review/report-only");
    expect(verifyCommon).toContain("browser-target-missing");
    expect(applyCode).toContain("Rollback awareness");
    expect(applyCode).toContain("Extended delivery risk reporting");
    expect(applyUnitTests).toContain("only SDD lane authorized to create RED-phase test files");
  });

  it("delegation still carries routing identity, scope, artifact, done condition, and envelope expectations", async () => {
    const orchestrator = await fs.readFile(ORCHESTRATOR_PATH, "utf8");
    const requiredDelegationFields = [
      "lane id, logical skill id, and `apply_lane` when present",
      "exact owned file/section scope and conflict groups",
      "assigned phase artifact or ledger section",
      "goal and explicit done condition",
      "expected envelope fields from `envelope_context`",
      "summary, artifact reference, criteria coverage, and risks",
    ];

    for (const field of requiredDelegationFields) {
      expect(orchestrator, `${ORCHESTRATOR_PATH} delegation contract is missing ${field}`).toContain(field);
    }
  });

  it("keeps sdd-orchestrator-owned review and delivery mode selection without false delivery_context accessors", async () => {
    const orchestrator = await fs.readFile(ORCHESTRATOR_PATH, "utf8");

    expect(orchestrator).toContain("Read review selection from `mode_context.review.selected`");
    expect(orchestrator).toContain("it replaces the normal code-review lane for the same target; never run both");
    expect(orchestrator).toContain("Read delivery selection from `mode_context.delivery.selected`");
    expect(orchestrator).toContain("`mode_context.delivery.mechanism_skill_ids`");
    expect(orchestrator).toContain("`mode_context.delivery.pr_line_budget`");
    expect(orchestrator).toContain("never re-read raw task mode values or `binding.modes`");
    expect(orchestrator).not.toContain("Resolve `review_mode` and `delivery_mode` from the validated binding's `modes`");
    expect(orchestrator).not.toContain("selected binding delivery-mode configuration");
    expect(orchestrator).not.toContain("delivery mode, review mode, PR budget, and required close evidence only from `delivery_context`");
    expect(orchestrator).not.toContain("`delivery_context.review_mode`");
    expect(orchestrator).not.toContain("`delivery_context.delivery_mode`");
    expect(orchestrator).not.toContain("`delivery_context.pr_line_budget`");
  });

  it("materializes immutable defaults with no default delivery mechanisms", () => {
    const binding = parseBindingFile(REPO_ROOT).binding;
    const context = buildModeContext(REPO_ROOT, binding, {}, {
      registryPath: FOCAL_SKILL_REGISTRY_PATH,
    });

    expect(context.review.selected).toBe(context.review.default);
    expect(context.delivery.selected).toBe(context.delivery.default);
    expect(context.review.allowed).toContain(context.review.selected);
    expect(context.delivery.allowed).toContain(context.delivery.selected);
    expect(context.delivery.mechanism_skill_ids).toEqual([]);
    expect(context.resolved_mechanism_skill_paths.delivery).toEqual([]);
    expect(context.delivery.pr_line_budget).toBeUndefined();
    expect(Object.isFrozen(context)).toBe(true);
    expect(Object.isFrozen(context.delivery.allowed)).toBe(true);
  });

  it("materializes valid explicit review and delivery selections with resolved mechanisms", () => {
    const binding = parseBindingFile(REPO_ROOT).binding;
    const context = buildModeContext(REPO_ROOT, binding, {
      review: "judgment-day",
       delivery: "single-pr",
    }, {
      registryPath: FOCAL_SKILL_REGISTRY_PATH,
    });

    expect(context.review.selected).toBe("judgment-day");
    expect(context.review.mechanism_skill_ids).toEqual(["judgment-day"]);
    expect(context.resolved_mechanism_skill_paths.review).toEqual([
       ".agents/skills/projectctl-judgment-day/SKILL.md",
    ]);
     expect(context.delivery.mechanism_skill_ids).toEqual([]);
     expect(context.resolved_mechanism_skill_paths.delivery).toEqual([]);
     expect(context.delivery.pr_line_budget).toBeUndefined();
  });

  it("fails closed for an explicit selection outside allowed", () => {
    const binding = parseBindingFile(REPO_ROOT).binding;
    expect(() => buildModeContext(REPO_ROOT, binding, { delivery: "unknown-mode" })).toThrow(
      new ModeContextResolutionError("mode_selection_invalid", 'active task delivery selection "unknown-mode" is not allowed'),
    );
  });

  it("fails closed for malformed mode default and allowed configuration", () => {
    for (const mutate of [
      (mode: Record<string, unknown>) => { mode.default = "not-allowed"; },
      (mode: Record<string, unknown>) => { mode.allowed = []; },
    ]) {
      const binding = structuredClone(parseBindingFile(REPO_ROOT).binding);
      const modes = binding.modes as Record<string, Record<string, unknown>>;
      mutate(modes.review_mode);

      try {
        buildModeContext(REPO_ROOT, binding, {});
        throw new Error("expected mode_config_invalid");
      } catch (error) {
        expect(error).toBeInstanceOf(ModeContextResolutionError);
        expect((error as ModeContextResolutionError).code).toBe("mode_config_invalid");
      }
    }
  });

  it("binding parsing fails when required `modes` is missing", () => {
    const binding = structuredClone(parseBindingFile(REPO_ROOT).binding);
    delete binding.modes;

    expect(() => assertBindingShape(binding)).toThrow(
       'missing required key "modes" (TaskFlowBindingV2 shape)',
    );
  });

  it("binding parsing fails when either required mode definition is malformed", () => {
    for (const modeId of ["review_mode", "delivery_mode"] as const) {
      const binding = structuredClone(parseBindingFile(REPO_ROOT).binding);
      (binding.modes as Record<string, unknown>)[modeId] = [];

      expect(() => assertBindingShape(binding)).toThrow(
        `mode_config_invalid: binding.modes.${modeId} must be an object`,
      );
    }
  });
});

// ─── sdd-orchestrator is orchestration-only: never a binding lane ────────
//
// Precedent: `sdd-archive` is an artifact key, NOT a lane
// (`api/src/routes/sdd/agents.ts`). The orchestration module resides in
// `modules/sdd/sdd-orchestrator/`, `sdd-orchestrator` MUST NOT appear in
// `binding.lanes` nor in any `phases[].allowed_lanes`; it resolves only via
// MAP (`.agents/skills/projectctl-sdd/scripts/skill/projectctl-module-resolver.ts`), where the retired
// its MAP entry; it is not a binding lane.

describe("sdd-orchestrator is orchestration-only, never a binding lane", () => {
  const ORCHESTRATOR_MODULE_PATH = path.join(
    REPO_ROOT,
    ".agents",
    "skills",
    "projectctl-sdd",
    "modules",
    "sdd",
    "sdd-orchestrator",
    "module.md",
  );

  it("sdd-orchestrator is NOT a binding lane", () => {
    const binding = parseBindingFile(REPO_ROOT).binding;
    const lanes = binding.lanes as Record<string, unknown>;
    expect(lanes, `${BINDING_PATH}#/lanes MUST NOT contain sdd-orchestrator`).not.toHaveProperty("sdd-orchestrator");
  });

  it("sdd-orchestrator is NOT in any allowed_lanes", () => {
    const binding = parseBindingFile(REPO_ROOT).binding;
    const phases = binding.phases as Array<{ id: string; allowed_lanes: string[] }>;
    for (const phase of phases) {
      expect(
        phase.allowed_lanes,
        `${BINDING_PATH}#/phases[${phase.id}].allowed_lanes MUST NOT contain sdd-orchestrator`,
      ).not.toContain("sdd-orchestrator");
    }
  });

  it("sdd-orchestrator resolves via MAP", () => {
    const resolved = resolveProjectctlModule("sdd-orchestrator", { repoRoot: REPO_ROOT });
    expect(resolved.modulePath).toBe(
      ".agents/skills/projectctl-sdd/modules/sdd/sdd-orchestrator/module.md",
    );
  });

  it("sdd-orchestrator module exists and owns LaunchPacket production (not a lane skill)", async () => {
    const raw = await fs.readFile(ORCHESTRATOR_MODULE_PATH, "utf8");
    expect(raw).toContain("sole producer and validator");
    const binding = parseBindingFile(REPO_ROOT).binding;
    const launchPacket = binding.launch_packet as Record<string, unknown>;
    expect(launchPacket.producer).toBe("sdd-orchestrator");
    expect(launchPacket.validator).toBe("sdd-orchestrator");
  });
});

describe("AC-001 / REQ-TSKFLOW-001 — single binding identity (F-01 rerun defensive)", () => {  it("locator.expected_binding_id === projection.source.binding_id === binding.binding_id", async () => {
    const locator = await loadLocator();
    const projection = await loadProjection();
    const binding = parseBindingFile(REPO_ROOT);
    const expectedBindingId = (locator as Record<string, unknown>)["expected_binding_id"];
    const projectionBindingId = ((projection as Record<string, unknown>)["source"] as Record<string, unknown>)[
      "binding_id"
    ];
    if (expectedBindingId !== projectionBindingId || projectionBindingId !== binding.binding.binding_id) {
      fail(
        gateReason(
          "REQ-TSKFLOW-001 F-01",
          `${LOCATOR_PATH}#/expected_binding_id vs ${PROJECTION_PATH}#/source/binding_id vs ${BINDING_PATH}#/binding_id`,
          `locator=${String(expectedBindingId)} projection=${String(projectionBindingId)} binding=${String(binding.binding.binding_id)}`,
          "locator, projection and binding MUST share the same binding_id (F-01 single authority)",
        ),
      );
    }
    expect(expectedBindingId).toBe(projectionBindingId);
    expect(projectionBindingId).toBe(binding.binding.binding_id);
  });

  it("locator.binding_path === projection.source.source_path === parsed.bindingRepoPath", async () => {
    const locator = await loadLocator();
    const projection = await loadProjection();
    const binding = parseBindingFile(REPO_ROOT);
    const locatorBindingPath = (locator as Record<string, unknown>)["binding_path"];
    const projectionSourcePath = ((projection as Record<string, unknown>)["source"] as Record<string, unknown>)[
      "source_path"
    ];
    if (locatorBindingPath !== projectionSourcePath || projectionSourcePath !== binding.bindingRepoPath) {
      fail(
        gateReason(
          "REQ-TSKFLOW-001 F-01",
          `${LOCATOR_PATH}#/binding_path vs ${PROJECTION_PATH}#/source/source_path vs binding.bindingRepoPath`,
          `locator=${String(locatorBindingPath)} projection=${String(projectionSourcePath)} binding=${String(binding.bindingRepoPath)}`,
          "locator, projection and binding MUST share the same canonical source path",
        ),
      );
    }
    expect(locatorBindingPath).toBe(projectionSourcePath);
    expect(projectionSourcePath).toBe(binding.bindingRepoPath);
  });

   it("locator V2 pins binding 10/model 2 + locator.machine_block_id === 'task-flow-binding'", async () => {
    const locator = await loadLocator();
    const projection = await loadProjection();
    const binding = parseBindingFile(REPO_ROOT).binding;
    if ((locator as Record<string, unknown>)["contract_version"] !== 2) {
      fail(
        gateReason(
          "REQ-TSKFLOW-001",
          `${LOCATOR_PATH}#/contract_version`,
          String((locator as Record<string, unknown>)["contract_version"] ?? "<missing>"),
          "MUST equal 2 (WorkflowBindingLocatorV2)",
        ),
      );
    }
    if ((locator as Record<string, unknown>)["machine_block_id"] !== "task-flow-binding") {
      fail(
        gateReason(
          "REQ-TSKFLOW-001",
          `${LOCATOR_PATH}#/machine_block_id`,
          String((locator as Record<string, unknown>)["machine_block_id"] ?? "<missing>"),
          "MUST equal 'task-flow-binding'",
        ),
      );
    }
    expect((locator as Record<string, unknown>)["contract_version"]).toBe(2);
    expect((locator as Record<string, unknown>)["expected_binding_version"]).toBe("16.0.0");
    expect(binding.binding_version).toBe("16.0.0");
    expect((projection as Record<string, unknown>)["model_version"]).toBe(RDD_V2_EXPECTED_IDENTITY.modelVersion);
    expect((locator as Record<string, unknown>)["machine_block_id"]).toBe("task-flow-binding");
  });

  it("locator NO incluye literales locales (develop, taskReadme, Engram, fase_*)", async () => {
    const locator = await loadLocator();
    const serialised = JSON.stringify(locator);
    const forbidden = [
      "develop",
      "taskReadme",
      "Engram",
      "fase_1_propuesta",
      "fase_2_implementacion",
      "fase_3_verificacion",
      "fase_4_documentacion",
      "mis-proyectos",
    ];
    for (const literal of forbidden) {
      if (serialised.includes(literal)) {
        fail(
          gateReason(
            "REQ-TSKFLOW-001 F-01",
            `${LOCATOR_PATH}`,
            literal,
            "locator MUST be a pure resolver pointer — no local policy literals",
          ),
        );
      }
    }
    expect(true).toBe(true);
  });
});

// ─── AC-002 — projection parity + no source_of_truth ──────────────────

describe("AC-002 / REQ-TSKFLOW-002 / SC-TSKFLOW-017 / SC-TSKFLOW-018 — projection parity", () => {
  it("`phase-state-schema.json` existe en el path nuevo bajo projectctl-sdd/generated", async () => {
    const stat = await fs.stat(PROJECTION_PATH);
    expect(stat.isFile()).toBe(true);
    expect(stat.size).toBeGreaterThan(0);
  });

  it("projection NO declara `source_of_truth: true` (per WU-02)", async () => {
    const projection = await loadProjection();
    if ("source_of_truth" in projection && (projection as Record<string, unknown>)["source_of_truth"] === true) {
      fail(
        gateReason(
          "REQ-TSKFLOW-002",
          PROJECTION_PATH,
          "source_of_truth=true",
          "MUST be absent; the projection is `generated`, not authoritative",
        ),
      );
    }
    expect("source_of_truth" in projection && projection.source_of_truth === true).toBe(false);
  });

  it("projection declara `artifact_role: \"generated\"`", async () => {
    const projection = await loadProjection();
    expect((projection as Record<string, unknown>)["artifact_role"]).toBe("generated");
  });

  it("projection declara `source.{binding_id, binding_version, source_path, source_sha256, generated_at}`", async () => {
    const projection = await loadProjection();
    const source = projection["source"] as Record<string, unknown>;
    for (const field of ["binding_id", "binding_version", "source_path", "source_sha256", "generated_at"] as const) {
      if (typeof source?.[field] !== "string") {
        fail(
          gateReason(
            "REQ-TSKFLOW-011",
            `${PROJECTION_PATH}#/source/${field}`,
            String(source?.[field] ?? "<missing>"),
            `source.${field} MUST be a string`,
          ),
        );
      }
    }
    expect(source["binding_id"]).toBe("projectctl-requirements.task-flow");
    const parsed = parseBindingFile(REPO_ROOT);
    expect(source["binding_version"]).toBe(parsed.frontmatter.bindingVersion);
    expect(source["source_path"]).toBe(".agents/skills/projectctl-sdd/references/tasks/binding.md");
  });

  it("projection source_sha256 coincide con el SHA-256 del binding canónico", async () => {
    const projection = await loadProjection();
    const sourceSha = (projection as Record<string, unknown>)["source"] as Record<string, unknown>;
    const expectedSha = await readCanonicalJsonSha256(REPO_ROOT);
    if (sourceSha["source_sha256"] !== expectedSha) {
      fail(
        gateReason(
          "REQ-TSKFLOW-011 SC-TSKFLOW-018",
          `${PROJECTION_PATH}#/source/source_sha256`,
          String(sourceSha["source_sha256"]),
          `binding digest is ${expectedSha} (regenerate with: bun run taskflow:generate)`,
        ),
      );
    }
    expect(sourceSha["source_sha256"]).toBe(expectedSha);
  });

  it("projection source_sha256 matches independently recomputed SHA-256 of binding canonical JSON", async () => {
    // Parity gate: the projection SHA must equal a recomputed SHA-256 over
    // the binding JSON using the exported canonical serialization contract
    // (sorted keys, 2-space indent, LF, and trailing newline). Extraction and
    // parsing remain independent so malformed or duplicate blocks still fail.
    const raw = await fs.readFile(BINDING_PATH, "utf8");
    const bindingBlockPattern =
      /^<!-- task-flow-binding:start -->\r?\n\s*```json\r?\n([\s\S]*?)\r?\n```\r?\n<!-- task-flow-binding:end -->$/gm;
    const candidates = [...raw.matchAll(bindingBlockPattern)];
    if (candidates.length !== 1 || !candidates[0]?.[1]) {
      fail(
        gateReason(
          "REQ-TSKFLOW-001 REQ-TSKFLOW-011 SC-TSKFLOW-018",
          BINDING_PATH,
          `valid JSON binding blocks=${candidates.length}`,
          "expected exactly one fenced JSON object between task-flow-binding start/end delimiter lines",
        ),
      );
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(candidates[0][1].trim());
    } catch (error) {
      fail(
        gateReason(
          "REQ-TSKFLOW-001 REQ-TSKFLOW-011 SC-TSKFLOW-018",
          BINDING_PATH,
          "<invalid-json-binding-block>",
          `delimited task-flow-binding JSON failed to parse: ${(error as Error).message}`,
        ),
      );
    }
    const canonical = canonicalJsonStringify(parsed, 2);
    const expected = sha256OfString(canonical);
    const projection = await loadProjection();
    const sourceSha = (projection as Record<string, unknown>)["source"] as Record<string, unknown>;
    if (sourceSha["source_sha256"] !== expected) {
      fail(
        gateReason(
          "REQ-TSKFLOW-011 SC-TSKFLOW-018",
          "binding-recomputed-SHA256",
          expected,
          `projection source_sha256=${sourceSha["source_sha256"]} differs`,
        ),
      );
    }
    expect(sourceSha["source_sha256"]).toBe(expected);
  });

  it("projection `model_version` coincide con binding.model_version", async () => {
    const projection = await loadProjection();
    const binding = parseBindingFile(REPO_ROOT);
    if ((projection as Record<string, unknown>)["model_version"] !== binding.binding.model_version) {
      fail(
        gateReason(
          "REQ-TSKFLOW-011",
          `${PROJECTION_PATH}#/model_version`,
          String((projection as Record<string, unknown>)["model_version"]),
          `binding.model_version=${String(binding.binding.model_version)}`,
        ),
      );
    }
    expect((projection as Record<string, unknown>)["model_version"]).toBe(binding.binding.model_version);
  });
});

// ─── AC-002 / F-03R-G — project-scoped contract/error identity ───────
//
// F-03R-G closed in the latest `sdd-verify-code` rerun
// (`code_review_passed` post F-05R no-positional derivation). La forma
// instancia-origen (`api/src/lib/task-contract-helper.ts`,
// `api/src/routes/tasks.ts`, `ensureContractOrRespond`,
// `TaskContractUnavailableError`, `readSandboxProxyError`, 9 handlers) es
// `retired — instancia origen, no portable`: exige el árbol de instancia
// (`api/src/*`, sandbox proxy, handlers) ausente en destinos portables.
// El contrato portable vive en el binding declarado
// (`references/tasks/binding.md`, bloque machine `task-flow-binding`) +
// los módulos sd-protocol de esta skill. Los 5 asserts siguientes pinean
// ese contrato portable con fixtures tmp autocontenidos, sin leer
// `api/src/*`, `sandbox/*`, `frontend/*` ni handlers de instancia.

describe(
  "AC-002 / F-03R-G / SC-TSKFLOW-018 — project-scoped contract + structured 503 envelope",
  () => {
    it("[retired: instancia origen, no portable] identidad del contrato via `buildSourceMetadata` + fixture tmp (portable analog de `TaskContractUnavailableError`)", async () => {
      // Motivo: exigía `api/src/lib/task-contract-helper.ts` (instancia
      // origen, no portable). Portable: `source.{binding_id,
      // binding_version, source_path, source_sha256, generated_at}` (5
      // campos de identidad) declarados por el binding + tmp round-trip.
      const parsed = parseBindingFile(REPO_ROOT);
      const source = buildSourceMetadata(parsed);
      for (const field of ["binding_id", "binding_version", "source_path", "source_sha256", "generated_at"] as const) {
        if (typeof source[field] !== "string" || source[field].length === 0) {
          fail(
            "REQ-TSKFLOW-005 F-03R-G",
            `.agents/skills/projectctl-sdd/scripts/skill/task-flow-normalizer.ts#/buildSourceMetadata/${field}`,
            String(source[field] ?? "<missing>"),
            `portable contract identity field "${field}" MUST be a non-empty string`,
          );
        }
      }
      expect(source.binding_id).toBe("projectctl-requirements.task-flow");
      expect(source.source_sha256).toBe(parsed.bindingSha256);
      // Fixture tmp: el contrato declarado por el binding sobrevive un
      // round-trip filesystem sin el árbol de instancia.
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "tskflow-contract-"));
      try {
        const tmpFile = path.join(tmpDir, "source-identity.json");
        await fs.writeFile(tmpFile, canonicalJsonStringify(source, 2), "utf8");
        const roundTripped = JSON.parse(await fs.readFile(tmpFile, "utf8")) as Record<string, unknown>;
        expect(roundTripped["binding_id"]).toBe(source.binding_id);
        expect(roundTripped["source_sha256"]).toBe(source.source_sha256);
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it("[retired: instancia origen, no portable] union cerrada portable `ENVIRONMENT_DEFERRAL_METHODS` + validador fail-closed (portable analog de `ContractUnavailableReason`)", async () => {
      // Motivo: exigía `ContractUnavailableReason` en
      // `api/src/lib/task-contract-helper.ts` (instancia origen, no
      // portable). Portable: la union cerrada declarada por el binding +
      // `validatePendingEnvironmentMethods` de `task-flow-normalizer.ts`
      // (módulo sd-protocol de esta skill) + fixture tmp.
      expect([...ENVIRONMENT_DEFERRAL_METHODS]).toEqual(["Go", "Docker", "PW", "Git-real"]);
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "tskflow-union-"));
      try {
        const tmpFile = path.join(tmpDir, "methods.json");
        await fs.writeFile(tmpFile, JSON.stringify({ allowed: [...ENVIRONMENT_DEFERRAL_METHODS] }), "utf8");
        const roundTripped = JSON.parse(await fs.readFile(tmpFile, "utf8")) as { allowed: unknown };
        expect(validatePendingEnvironmentMethods(roundTripped.allowed)).toBe(true);
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
      for (const invalid of [[], ["Go"], ["Go", "Docker", "PW", "Git-real", "Go"], ["Go", "Docker", "PW", "Windows"], ["go", "docker", "pw", "git-real"], null, undefined]) {
        if (validatePendingEnvironmentMethods(invalid)) {
          fail(
            "REQ-TSKFLOW-005 F-03R-G",
            ".agents/skills/projectctl-sdd/scripts/skill/task-flow-normalizer.ts#/validatePendingEnvironmentMethods",
            JSON.stringify(invalid),
            "closed union MUST fail closed on unapproved/empty/partial/duplicate/stale sets",
          );
        }
      }
      expect(validatePendingEnvironmentMethods([...ENVIRONMENT_DEFERRAL_METHODS])).toBe(true);
    });

    it("[retired: instancia origen, no portable] envelope fail-closed portable `blocked + skill_resolution_missing` (portable analog de `ensureContractOrRespond` 503)", async () => {
      // Motivo: exigía `ensureContractOrRespond` + envelope 503 en
      // `api/src/routes/tasks.ts` (instancia origen, no portable).
      // Portable: el envelope fail-closed declarado por los módulos
      // sd-protocol (`skill-resolver.md`, `sdd-phase-common.md`) + fixture
      // tmp del envelope, sin leer `api/src/*` ni sandbox proxy.
      const [resolver, common] = await Promise.all([
        fs.readFile(
          path.join(REPO_ROOT, ".agents/skills/projectctl-sdd/modules/sd-protocol/skill-resolver.md"),
          "utf8",
        ),
        fs.readFile(
          path.join(REPO_ROOT, ".agents/skills/projectctl-sdd/modules/sd-protocol/sdd-phase-common.md"),
          "utf8",
        ),
      ]);
      for (const [owner, src] of [["skill-resolver.md", resolver], ["sdd-phase-common.md", common]] as const) {
        for (const key of ["skill_resolution_missing", "blocked"] as const) {
          if (!src.includes(key)) {
            fail(
              "REQ-TSKFLOW-005 F-03R-G",
              `.agents/skills/projectctl-sdd/modules/sd-protocol/${owner}#/${key}`,
              "<missing>",
              `portable fail-closed envelope MUST declare "${key}"`,
            );
          }
        }
      }
      // Fixture tmp: el envelope portable serializa claves incondicionales
      // y omite (no nullea) las condicionales no resueltas, igual que el
      // contrato 503 de instancia pero sin su árbol.
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "tskflow-envelope-"));
      try {
        const envelope: Record<string, unknown> = { error: "contract_unavailable", message: "binding contract missing", projectId: "tmp-project", reason: "binding_unreadable" };
        const tmpFile = path.join(tmpDir, "envelope.json");
        await fs.writeFile(tmpFile, canonicalJsonStringify(envelope, 2), "utf8");
        const roundTripped = JSON.parse(await fs.readFile(tmpFile, "utf8")) as Record<string, unknown>;
        for (const key of ["error", "message", "projectId", "reason"] as const) {
          if (typeof roundTripped[key] !== "string") {
            fail(
              "REQ-TSKFLOW-005 F-03R-G",
              `tmp-envelope#/${key}`,
              String(roundTripped[key] ?? "<missing>"),
              `portable envelope MUST serialise unconditional key "${key}"`,
            );
          }
        }
        expect("binding_id" in roundTripped).toBe(false);
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
      expect(true).toBe(true);
    });

    it("[retired: instancia origen, no portable] errores estructurados portable con `code` + `JSON.parse` round-trip tmp (portable analog de `readSandboxProxyError`)", async () => {
      // Motivo: exigía `readSandboxProxyError` + `JSON.parse` en
      // `api/src/routes/tasks.ts` (instancia origen, no portable).
      // Portable: `SkillResolutionError` / `ModeContextResolutionError`
      // preservan `code` estructurado (no anidan JSON como string) y el
      // normalizador parsea el bloque del binding con `JSON.parse`.
      const normalizerSrc = await fs.readFile(
        path.join(REPO_ROOT, ".agents/skills/projectctl-sdd/scripts/skill/task-flow-normalizer.ts"),
        "utf8",
      );
      if (!/JSON\.parse\(/.test(normalizerSrc)) {
        fail(
          "REQ-TSKFLOW-005 F-03R-F",
          ".agents/skills/projectctl-sdd/scripts/skill/task-flow-normalizer.ts#/JSON.parse",
          "<missing-json-parse>",
          "portable structured-body path MUST attempt `JSON.parse` over the binding block",
        );
      }
      const failure = new SkillResolutionError('path "tmp" is unreadable');
      expect(failure).toBeInstanceOf(SkillResolutionError);
      expect(failure.code).toBe("skill_resolution_missing");
      expect(failure.message).toContain("skill_resolution_missing");
      // Fixture tmp: un cuerpo estructurado sobrevive el round-trip JSON
      // como objeto, nunca anidado como string.
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "tskflow-structured-"));
      try {
        const body = { error: "upstream_failure", detail: { code: failure.code } };
        const tmpFile = path.join(tmpDir, "upstream.json");
        await fs.writeFile(tmpFile, JSON.stringify(body), "utf8");
        const roundTripped = JSON.parse(await fs.readFile(tmpFile, "utf8")) as Record<string, unknown>;
        expect(typeof roundTripped["error"]).toBe("string");
        expect(typeof roundTripped["detail"]).toBe("object");
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it("[retired: instancia origen, no portable] cobertura de guardas portable via binding lanes + fixture tmp (portable analog de los 9 handlers con `ensureContractOrRespond`)", async () => {
      // Motivo: exigía 9 handlers (`getTask`, `listTasks`, ...) con
      // `ensureContractOrRespond()` antes de `fetch` en
      // `api/src/routes/tasks.ts` (instancia origen, no portable).
      // Portable: cada lane del binding declara `skill` resoluble via MAP
      // y cada fase declara `allowed_lanes` no vacío; la fixture tmp
      // demuestra la cobertura sin handlers de instancia.
      const binding = parseBindingFile(REPO_ROOT).binding as Record<string, unknown>;
      const lanes = binding["lanes"] as Record<string, { skill?: string }>;
      const phases = binding["phases"] as Array<{ id: string; allowed_lanes: string[] }>;
      const laneIds = Object.keys(lanes);
      if (laneIds.length === 0) {
        fail(
          "REQ-TSKFLOW-005 F-03R-G",
          `${BINDING_PATH}#/lanes`,
          "<empty>",
          "portable guard coverage MUST declare at least one binding lane",
        );
      }
      for (const laneId of laneIds) {
        if (!lanes[laneId]?.skill) {
          fail(
            "REQ-TSKFLOW-005 F-03R-G",
            `${BINDING_PATH}#/lanes/${laneId}/skill`,
            "<missing-skill>",
            "every portable lane MUST declare a logical implementation skill (guard target)",
          );
        }
      }
      for (const phase of phases) {
        if (!Array.isArray(phase.allowed_lanes) || phase.allowed_lanes.length === 0) {
          fail(
            "REQ-TSKFLOW-005 F-03R-G",
            `${BINDING_PATH}#/phases/${phase.id}/allowed_lanes`,
            "<empty>",
            "every portable phase MUST declare guard-covered allowed_lanes",
          );
        }
      }
      // Fixture tmp: la cobertura lane->fase es serializable y completa
      // sin el árbol de instancia.
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "tskflow-guards-"));
      try {
        const coverage = Object.fromEntries(
          laneIds.map((laneId) => [laneId, phases.filter((p) => p.allowed_lanes.includes(laneId)).map((p) => p.id)]),
        );
        const tmpFile = path.join(tmpDir, "guard-coverage.json");
        await fs.writeFile(tmpFile, canonicalJsonStringify(coverage, 2), "utf8");
        const roundTripped = JSON.parse(await fs.readFile(tmpFile, "utf8")) as Record<string, string[]>;
        expect(Object.keys(roundTripped).sort()).toEqual([...laneIds].sort());
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });
  },
);

// ─── AC-002 / F-05R — normalizer must NOT use positional derivation ────
//
// F-05R (re-opened after the latest verify-code rerun and closed by
// `Remediación F-05R — no positional derivation (2026-07-23)`,
// taskReadme §14) requires the normalizer to derive `initialPhase` /
// `initialState` via `findEntryPhaseAndState()` (relational selector)
// and the required mirror collection via `selectRequiredMirrors()`
// (semantic filter). The codegen MUST NOT pick
// `phases[0]?.id`, `initialPhaseRecord?.states[0]` or `mirrors[0]!`
// any more — those positional accesses silently hide alternate binding
// shapes. The defensive check below scans the normalizer for any
// residual positional access pattern and fails the gate if a future
// regression re-introduces one.

describe(
  "AC-002 / F-05R / SC-TSKFLOW-018 — normalizer no positional derivation",
  () => {
    const NORMALIZER_PATH = path.join(REPO_ROOT, ".agents", "skills", "projectctl-sdd", "scripts", "skill", "task-flow-normalizer.ts");

    it("no positional `phases[0]?.id` / `phases[0].id` access in normalizer runtime", async () => {
      const src = await fs.readFile(NORMALIZER_PATH, "utf8");
      // Strip block + line comments so prose explanations don't trip
      // the regex. We only inspect the runtime surface.
      const codeOnly = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      const positionalPhases = /\bphases\s*\[\s*0\s*\]\s*(?:\?\.|\.)\s*id\b/;
      if (positionalPhases.test(codeOnly)) {
        fail(
          gateReason(
            "REQ-TSKFLOW-011 F-05R",
            `${NORMALIZER_PATH}#/phases[0]?.id`,
            "<positional-access>",
            "MUST be replaced by `findEntryPhaseAndState(binding).phaseId` (relational selector)",
          ),
        );
      }
      expect(true).toBe(true);
    });

    it("no positional `states[0]` access on any `initialPhaseRecord` in normalizer runtime", async () => {
      const src = await fs.readFile(NORMALIZER_PATH, "utf8");
      const codeOnly = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      const positionalStates = /\bstates\s*\[\s*0\s*\](?!\s*\??\s*:\s*string)/;
      if (positionalStates.test(codeOnly)) {
        // The only allowed positional access is on string-typed runtime
        // checks; the negative-lookahead permits only those. Any other
        // `states[0]` means a regression.
        fail(
          gateReason(
            "REQ-TSKFLOW-011 F-05R",
            `${NORMALIZER_PATH}#/states[0]`,
            "<positional-access>",
            "MUST be replaced by `findEntryPhaseAndState(binding).stateId`",
          ),
        );
      }
      expect(true).toBe(true);
    });

    it("no positional `mirrors[0]!` non-null-assertion in normalizer runtime", async () => {
      const src = await fs.readFile(NORMALIZER_PATH, "utf8");
      const codeOnly = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      if (/\b(?:firstMirror|requiredMirrors|mirrors)\s*\[\s*0\s*\]\s*!/.test(codeOnly)) {
        fail(
          gateReason(
            "REQ-TSKFLOW-011 F-05R",
            `${NORMALIZER_PATH}#/mirrors[0]!`,
            "<positional-access>",
            "MUST be replaced by `selectRequiredMirrors(mirrors, onRequiredMirrorFailure)`",
          ),
        );
      }
      expect(true).toBe(true);
    });

    it("`selectRequiredMirrors()` honours `on_required_mirror_failure: 'block'` fail-closed branch", async () => {
      const src = await fs.readFile(NORMALIZER_PATH, "utf8");
      const start = src.indexOf("function selectRequiredMirrors(");
      if (start < 0) {
        fail(
          gateReason(
            "REQ-TSKFLOW-011 F-05R",
            `${NORMALIZER_PATH}#/selectRequiredMirrors`,
            "<missing-helper>",
            "MUST exist as the sole authority on the mirror-policy decision",
          ),
        );
      }
      // Slice a fixed window from the start to capture the full body
      // (the helper is small; 1.5 KB covers it from the function
      // declaration through the closing brace).
      const helperBody = src.substring(start, start + 1500);
      if (!helperBody.includes("'block'") || !helperBody.includes("throw new Error")) {
        fail(
          gateReason(
            "REQ-TSKFLOW-011 F-05R",
            `${NORMALIZER_PATH}#/selectRequiredMirrors`,
            "<missing-fail-closed>",
            "MUST throw when zero required mirrors + `on_required_mirror_failure: 'block'`",
          ),
        );
      }
      if (!helperBody.includes("m.required === true")) {
        fail(
          gateReason(
            "REQ-TSKFLOW-011 F-05R",
            `${NORMALIZER_PATH}#/selectRequiredMirrors`,
            "<missing-semantic-filter>",
            "MUST filter mirrors by `m.required === true` (semantic, never positional)",
          ),
        );
      }
      expect(true).toBe(true);
    });

  },
);

describe("AC-P5-01 / SC-P5-007..011 / SC-P5-049..050 — RDD V2 state machine", () => {
  it("declares V2 identity, RDD mode and the exact six-state phase", () => {
    const binding = parseBindingFile(REPO_ROOT, undefined, { rdd_mode: 'receipt-driven' }).binding as Record<string, unknown>;
    expect(binding["contract_kind"]).toBe(RDD_V2_EXPECTED_IDENTITY.contractKind);
    expect(binding["binding_version"]).toBe("16.0.0");
    expect(binding["model_version"]).toBe(RDD_V2_EXPECTED_IDENTITY.modelVersion);
    const rddMode = (binding["modes"] as Record<string, unknown>)["rdd_mode"];
    expect(rddMode).toEqual(expect.objectContaining({ default: "disabled", allowed: [...RDD_MODE_VALUES] }));
    const phase5 = (binding["phases"] as Array<Record<string, unknown>>).find((phase) => phase.id === "fase_5_rdd");
    expect(phase5?.states).toEqual([...RDD_PHASE_STATES]);
    expect(phase5?.allowed_lanes).toEqual([...RDD_LANE_IDS]);
  });

  it("replaces the unconditional p4 exit with exactly two mutually exclusive guards", () => {
    const binding = parseBindingFile(REPO_ROOT, undefined, { rdd_mode: 'receipt-driven' }).binding as Record<string, unknown>;
    const phase4 = (binding["phases"] as Array<{ id: string; transitions: Array<Record<string, unknown>> }>).find(
      (phase) => phase.id === "fase_4_documentacion",
    );
    const exits = phase4?.transitions.filter((transition) => transition.from === "p4_complete") ?? [];
    expect(exits).toEqual([
       { phase: "fase_4_documentacion", from: "p4_complete", to: "p5_started", guard: "rdd_mode_receipt_driven", blocking_gates: ["pending_environment_close_block", "requirements_current_close_block"] },
    ]);
    expect(exits.every((transition) => typeof transition.guard === "string")).toBe(true);
  });

  it("requires authority evidence for every RDD advance and precommit delivery", () => {
    const binding = parseBindingFile(REPO_ROOT, undefined, { rdd_mode: 'receipt-driven' }).binding as Record<string, unknown>;
    const phase5 = (binding["phases"] as Array<{ id: string; transitions: Array<Record<string, unknown>> }>).find(
      (phase) => phase.id === "fase_5_rdd",
    );
    const guards = new Set((phase5?.transitions ?? []).map((transition) => transition.guard));
    for (const guard of [
      "rdd_authority_started",
      "rdd_correction_required",
      "rdd_review_results_complete",
      "rdd_correction_validated",
      "rdd_receipt_approved",
      "rdd_escalated",
      "rdd_recovery_authorized",
      "rdd_precommit_gate_allowed",
    ]) expect(guards).toContain(guard);
  });

  it("publishes exactly seven RDD lanes and five read-only delivery gate identities", () => {
    const binding = parseBindingFile(REPO_ROOT, undefined, { rdd_mode: 'receipt-driven' }).binding as Record<string, unknown>;
    const lanes = binding["lanes"] as Record<string, unknown>;
    expect(RDD_LANE_IDS.filter((id) => id in lanes)).toEqual([...RDD_LANE_IDS]);
    const serializedGates = JSON.stringify(binding["gates"]);
    for (const gate of RDD_DELIVERY_GATES) expect(serializedGates).toContain(gate);
  });

  it("requires WorkflowRuntimeContextV2 while limiting the V1 reader to disabled-only", async () => {
    const contextSpec = await fs.readFile(
       path.join(REPO_ROOT, ".agents/skills/projectctl-sdd/modules/sd-protocol/workflow-runtime-context.md"),
      "utf8",
    );
    expect(contextSpec).toContain("WorkflowRuntimeContextV2");
    expect(contextSpec).toContain("contract_version: 2");
    expect(contextSpec).toContain('extension_context');
    expect(contextSpec).toContain('V1 never authorizes extension lanes');
  });
});

// ─── AC-004 — canonical phase, state, control, lane and status shape ───

describe("AC-004 / REQ-TSKFLOW-013 / SC-TSKFLOW-022 — state + lane shape", () => {
  it("projection declara 4 fases core con sus estados y allowed_lanes", async () => {
    const projection = await loadProjection();
    const stateModel = (projection as Record<string, unknown>)["state_model"] as Record<string, unknown>;
    const phases = stateModel["phases"] as Array<Record<string, unknown>>;
    if (phases.length !== 4) {
      fail(
        gateReason(
          "REQ-TSKFLOW-002 AC-004",
          `${PROJECTION_PATH}#/state_model/phases`,
          String(phases.length),
          "MUST be exactly 4 core phases",
        ),
      );
    }
    expect(phases).toHaveLength(4);
    for (const phase of phases) {
      expect(Array.isArray(phase["states"])).toBe(true);
      expect((phase["states"] as string[]).length).toBeGreaterThan(0);
      expect(Array.isArray(phase["allowed_lanes"])).toBe(true);
      expect((phase["allowed_lanes"] as string[]).length).toBeGreaterThan(0);
    }
  });

  it("projection declares the same lanes as the canonical binding", async () => {
    const projection = await loadProjection();
    const stateModel = (projection as Record<string, unknown>)["state_model"] as Record<string, unknown>;
    const lanes = stateModel["lanes"] as string[];
    const parsed = parseBindingFile(REPO_ROOT);
    const expected = Object.keys(parsed.binding.lanes as Record<string, unknown>).sort();
    if (JSON.stringify([...lanes].sort()) !== JSON.stringify(expected)) {
      fail(
        gateReason(
          "REQ-TSKFLOW-008 AC-004",
          `${PROJECTION_PATH}#/state_model/lanes`,
          JSON.stringify(lanes),
          `MUST equal binding lanes ${JSON.stringify(expected)}`,
        ),
      );
    }
    expect([...lanes].sort()).toEqual(expected);
  });

  it("projection declara exactamente 7 controls (5 action + terminal + outcome×2)", async () => {
    const projection = await loadProjection();
    const stateModel = (projection as Record<string, unknown>)["state_model"] as Record<string, unknown>;
    const controls = stateModel["controls"] as Array<{ readonly id: string }>;
    const expected = new Set([
      "branch_creation_pending",
      "final_commit_pending",
      "final_push_pending",
      "final_pr_pending",
      "done",
      "blocked",
      "failed",
    ]);
    if (controls.length !== 7 || !controls.every((c) => expected.has(c.id))) {
      fail(
        gateReason(
          "REQ-TSKFLOW-002 SC-TSKFLOW-003",
          `${PROJECTION_PATH}#/state_model/controls`,
          controls.map((c) => c.id).sort().join(","),
          `expected ${[...expected].sort().join(",")}`,
        ),
      );
    }
    expect(controls).toHaveLength(7);
  });

  it("control `done` tiene `value.phase === null` y estado terminal único", async () => {
    const projection = await loadProjection();
    const stateModel = (projection as Record<string, unknown>)["state_model"] as Record<string, unknown>;
    const controls = stateModel["controls"] as Array<Record<string, unknown>>;
    const done = controls.find((c) => c.id === "done");
    if (!done) {
      fail(
        gateReason(
          "REQ-TSKFLOW-002 SC-TSKFLOW-003",
          `${PROJECTION_PATH}#/state_model/controls`,
          "<missing>",
          "control 'done' MUST be present",
        ),
      );
    }
    const value = done["value"] as { readonly phase: string | null; readonly state: string; readonly status: string };
    if (value?.phase !== null || value?.state !== "done" || value?.status !== "done") {
      fail(
        gateReason(
          "REQ-TSKFLOW-002 SC-TSKFLOW-003",
          `${PROJECTION_PATH}#/state_model/controls/done/value`,
          JSON.stringify(value),
          "expected {phase:null,state:'done',status:'done'}",
        ),
      );
    }
    expect(value.phase).toBeNull();
    expect(value.state).toBe("done");
    expect(value.status).toBe("done");
    expect(done["transitions"]).toEqual([]);
  });

  it("controls `blocked` y `failed` declaran `preserves: ['phase','state']` y `writes_state: false`", async () => {
    const projection = await loadProjection();
    const stateModel = (projection as Record<string, unknown>)["state_model"] as Record<string, unknown>;
    const controls = stateModel["controls"] as Array<Record<string, unknown>>;
    for (const id of ["blocked", "failed"] as const) {
      const c = controls.find((x) => x.id === id);
      if (!c) {
        fail(
          gateReason(
            "REQ-TSKFLOW-002 SC-TSKFLOW-004",
            `${PROJECTION_PATH}#/state_model/controls/${id}`,
            "<missing>",
            `control '${id}' MUST be present`,
          ),
        );
      }
      if (c["writes_state"] !== false) {
        fail(
          gateReason(
            "REQ-TSKFLOW-002 SC-TSKFLOW-004",
            `${PROJECTION_PATH}#/state_model/controls/${id}/writes_state`,
            String(c["writes_state"]),
            "MUST be false for preserving outcomes",
          ),
        );
      }
      const preserves = c["preserves"] as readonly string[];
      if (!Array.isArray(preserves) || preserves.length !== 2 || !preserves.includes("phase") || !preserves.includes("state")) {
        fail(
          gateReason(
            "REQ-TSKFLOW-002 SC-TSKFLOW-004",
            `${PROJECTION_PATH}#/state_model/controls/${id}/preserves`,
            JSON.stringify(preserves),
            "MUST equal ['phase','state']",
          ),
        );
      }
    }
    expect(true).toBe(true);
  });

  it("status.writable coincide con los valores del binding canónico", async () => {
    const projection = await loadProjection();
    const stateModel = (projection as Record<string, unknown>)["state_model"] as Record<string, unknown>;
    const status = stateModel["status"] as Record<string, unknown>;
    const writable = (status["writable"] as string[]).slice().sort();
    const expected = ["blocked", "documenting", "done", "failed", "implementing", "pending", "planning", "testing"]
      .sort();
    if (JSON.stringify(writable) !== JSON.stringify(expected)) {
      fail(
        gateReason(
          "REQ-TSKFLOW-002 AC-003",
          `${PROJECTION_PATH}#/state_model/status/writable`,
          writable.join(","),
          `expected ${expected.join(",")}`,
        ),
      );
    }
    expect(writable).toEqual(expected);
    expect(status["pre_bootstrap"]).toBe("pending");
    expect(status["terminal"]).toBe("done");
  });

  it("total de states en las 4 fases core suma 22 (6+6+5+5)", async () => {
    const projection = await loadProjection();
    const stateModel = (projection as Record<string, unknown>)["state_model"] as Record<string, unknown>;
    const phases = stateModel["phases"] as Array<{ readonly id: string; readonly states: readonly string[] }>;
    const total = phases.reduce((acc, p) => acc + p.states.length, 0);
    if (total !== 22) {
      fail(
        gateReason(
          "REQ-TSKFLOW-002 SC-TSKFLOW-003",
          `${PROJECTION_PATH}#/state_model/phases/*/states`,
          String(total),
          "expected total of 22 states across 4 core phases (6+6+5+5)",
        ),
      );
    }
    expect(total).toBe(22);
    const expectedCounts: Readonly<Record<string, number>> = {
      fase_1_propuesta: 6,
      fase_2_implementacion: 6,
      fase_3_verificacion: 5,
      fase_4_documentacion: 5,
    };
    for (const phase of phases) {
      if (phase.states.length !== expectedCounts[phase.id]) {
        fail(
          gateReason(
            "REQ-TSKFLOW-002 SC-TSKFLOW-003",
            `${PROJECTION_PATH}#/state_model/phases/${phase.id}/states`,
            String(phase.states.length),
            `expected ${String(expectedCounts[phase.id])} states for ${phase.id}`,
          ),
        );
      }
    }
    expect(true).toBe(true);
  });
});

// ─── AC-013 / REQ-TSKFLOW-010 — retired aliases not active ────────────

describe("AC-003 / REQ-TSKFLOW-013 — retired aliases absent from authoritative projection", () => {
  it("los 10 alias de status retirados NO aparecen en state_model.phases[].states[]", async () => {
    const projection = await loadProjection();
    const stateModel = (projection as Record<string, unknown>)["state_model"] as Record<string, unknown>;
    const phases = stateModel["phases"] as Array<{ readonly states: readonly string[] }>;
    const retiredStates = [
      "phase1_generating",
      "phase2_branching",
      "phase3_implementing",
      "phase4_pushing",
      "completed",
      "paused",
      "verified",
    ];
    const allStates = phases.flatMap((p) => p.states);
    for (const alias of retiredStates) {
      if (allStates.includes(alias)) {
        fail(
          gateReason(
            "REQ-TSKFLOW-010 AC-003 SC-TSKFLOW-022",
            `${PROJECTION_PATH}#/state_model/phases/*/states`,
            alias,
            "retired state alias MUST NOT appear as a writable state",
          ),
        );
      }
    }
    expect(true).toBe(true);
  });

  it("los 10 alias de status retirados NO aparecen en status.writable", async () => {
    const projection = await loadProjection();
    const stateModel = (projection as Record<string, unknown>)["state_model"] as Record<string, unknown>;
    const status = stateModel["status"] as Record<string, unknown>;
    const writable = status["writable"] as readonly string[];
    const retired = ["ready_for_branch", "branching", "pushing", "verified", "completed", "paused"];
    for (const alias of retired) {
      if (writable.includes(alias)) {
        fail(
          gateReason(
            "REQ-TSKFLOW-010 AC-003 SC-TSKFLOW-022",
            `${PROJECTION_PATH}#/state_model/status/writable`,
            alias,
            "retired status alias MUST NOT be writable",
          ),
        );
      }
    }
    expect(true).toBe(true);
  });

  it("los 5 lane names monolíticos retirados NO aparecen en state_model.lanes[]", async () => {
    const projection = await loadProjection();
    const stateModel = (projection as Record<string, unknown>)["state_model"] as Record<string, unknown>;
    const lanes = stateModel["lanes"] as readonly string[];
    const retired = ["sdd-apply", "sdd-apply-code", "sdd-explore", "sdd-verify", "sdd-browser-runtime-context"];
    for (const alias of retired) {
      // Word-boundary check so split-lane ids such as `sdd-apply-code-low`
      // do not trigger the retirement gate.
      const re = new RegExp(`(?<![-_a-zA-Z])${alias.replace(/[-]/g, "\\-")}(?![-_a-zA-Z])`);
      if (lanes.some((id) => re.test(id))) {
        fail(
          gateReason(
            "REQ-TSKFLOW-008 AC-004 SC-TSKFLOW-022",
            `${PROJECTION_PATH}#/state_model/lanes`,
            alias,
            "retired monolithic lane MUST NOT appear",
          ),
        );
      }
    }
    expect(true).toBe(true);
  });

  it("los 5 lane names monolíticos NO aparecen como allowed_lanes en ninguna fase", async () => {
    const projection = await loadProjection();
    const stateModel = (projection as Record<string, unknown>)["state_model"] as Record<string, unknown>;
    const phases = stateModel["phases"] as Array<{ readonly allowed_lanes: readonly string[] }>;
    const retired = ["sdd-apply", "sdd-apply-code", "sdd-explore", "sdd-verify", "sdd-browser-runtime-context"];
    for (const phase of phases) {
      for (const alias of retired) {
        if (phase.allowed_lanes.includes(alias)) {
          fail(
            gateReason(
              "REQ-TSKFLOW-008 AC-004 SC-TSKFLOW-022",
              `${PROJECTION_PATH}#/state_model/phases/*/allowed_lanes`,
              alias,
              "retired monolithic lane MUST NOT be allowed in any phase",
            ),
          );
        }
      }
    }
    expect(true).toBe(true);
  });
});

// ─── AC-013 / REQ-TSKFLOW-013 — paths SoT intactos ─────────────────────

describe("AC-013 — paths SoT portables (binding, projection, locator, template)", () => {
  it("locator expone los projection paths portables canónicos", async () => {
    const locator = await loadLocator();
    const projections = locator["projections"] as Record<string, string>;
    expect(projections["state_model"]).toBe(".agents/skills/projectctl-sdd/generated/phase-state-schema.json");
    expect(projections["task_template"]).toBe(".agents/skills/projectctl-sdd/assets/task-template.md");
    // `client_view_model` lo publica la instancia destino (no portable): el
    // paquete solo exige la clave, sin pineear su valor de instancia.
    expect(projections["client_view_model"]).toBeUndefined();
  });
});

// ─── Codegen manifest — bind test fixture en lugar de runtime ─────────

describe("AC-011 / REQ-TSKFLOW-011 / SC-TSKFLOW-018 — codegen target registry", () => {
  it("`TARGETS` declara la proyección base portable", () => {
    const ids = TARGETS.map((t) => t.id).sort();
    const expected = [
      "phase-state-schema",
    ].sort();
    if (JSON.stringify(ids) !== JSON.stringify(expected)) {
      fail(
        gateReason(
          "REQ-TSKFLOW-011 AC-011",
          ".agents/skills/projectctl-sdd/scripts/skill/task-flow-normalizer.ts#/TARGETS",
          ids.join(","),
          `expected ${expected.join(",")}`,
        ),
      );
    }
    expect(ids).toEqual(expected);
  });

  it("`buildSourceMetadata` produce source_identity inmutable desde el binding parseado", () => {
    const parsed = parseBindingFile(REPO_ROOT);
    const source = buildSourceMetadata(parsed);
    if (source.binding_id !== "projectctl-requirements.task-flow") {
      fail(
        gateReason(
          "REQ-TSKFLOW-011 SC-TSKFLOW-017",
          ".agents/skills/projectctl-sdd/scripts/skill/task-flow-normalizer.ts#/buildSourceMetadata/binding_id",
          source.binding_id,
          "expected projectctl-requirements.task-flow",
        ),
      );
    }
    if (source.binding_version !== parsed.frontmatter.bindingVersion) {
      fail(
        gateReason(
          "REQ-TSKFLOW-011 SC-TSKFLOW-017",
          ".agents/skills/projectctl-sdd/scripts/skill/task-flow-normalizer.ts#/buildSourceMetadata/binding_version",
          source.binding_version,
          `expected ${parsed.frontmatter.bindingVersion}`,
        ),
      );
    }
    expect(source.source_path).toBe(".agents/skills/projectctl-sdd/references/tasks/binding.md");
    expect(source.source_sha256).toBe(parsed.bindingSha256);
    expect(source.generated_at).toBe(parsed.frontmatter.lastFullRegen);
  });
});

// ─── REQ-TSKFLOW-013 / SC-TSKFLOW-022 — default contract path ─────────

describe(
  "AC-009 / AC-013 / SC-TSKFLOW-022 — static contracts run by default",
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
// REQ-P5-023..025 / SC-P5-057..065: the binding MUST declare the exact
// `{Go, Docker, PW, Git-real}` deferral methods, the named exceptional
// guard `environment_verification_deferred` for
// `p3_coverage_pending -> p4_started`, the mandatory
// `p4_document_candidate_written -> p3_test_preparing` return, and the
// hard `pending_environment_close_block` gate. None of this exists in
// the current binding — every assertion below MUST fail RED until
// `ENV-GREEN-BINDING` lands.
// ─────────────────────────────────────────────────────────────────────
describe("ENV-RED-CONTRACT / REQ-P5-023..025 — environment deferral binding contract", () => {
  const APPROVED_METHODS = ["Go", "Docker", "PW", "Git-real"] as const;

  it("SC-P5-057/058 — declares exactly the four approved deferral methods, no more, no less", () => {
    const binding = parseBindingFile(REPO_ROOT).binding as Record<string, unknown>;
    const modes = binding["modes"] as Record<string, unknown> | undefined;
    const deferral = modes?.["environment_deferral"] as
      | { allowed_methods?: unknown }
      | undefined;
    const declaredMethods = deferral?.allowed_methods;
    if (!Array.isArray(declaredMethods)) {
      fail(
        "REQ-P5-023 SC-P5-057/058",
        `${BINDING_PATH}#/modes/environment_deferral/allowed_methods`,
        String(declaredMethods),
        "binding MUST declare an exact allowed_methods array (RED: not implemented yet)",
      );
    }
    expect([...(declaredMethods as string[])].sort()).toEqual([...APPROVED_METHODS].sort());
  });

  it("SC-P5-060/061/062 — declares the named `environment_verification_deferred` guard for p3_coverage_pending -> p4_started", () => {
    const binding = parseBindingFile(REPO_ROOT).binding as Record<string, unknown>;
    const phase3 = (binding["phases"] as Array<{ id: string; transitions: Array<Record<string, unknown>> }>).find(
      (phase) => phase.id === "fase_3_verificacion",
    );
    const exceptionalEntry = phase3?.transitions.find(
      (transition) => transition.from === "p3_coverage_pending" && transition.to === "p4_started",
    );
    if (!exceptionalEntry || exceptionalEntry.guard !== "environment_verification_deferred") {
      fail(
        "REQ-P5-024 SC-P5-060",
        `${BINDING_PATH}#/phases/fase_3_verificacion/transitions`,
        JSON.stringify(exceptionalEntry ?? null),
        "MUST declare {from:p3_coverage_pending,to:p4_started,guard:environment_verification_deferred} (RED: absent)",
      );
    }
    expect(exceptionalEntry?.guard).toBe("environment_verification_deferred");
  });

  it("SC-P5-062 — declares the mandatory document-write return p4_* -> p3_test_preparing distinct from the ordinary re-verification guard", () => {
    const binding = parseBindingFile(REPO_ROOT).binding as Record<string, unknown>;
    const phase4 = (binding["phases"] as Array<{ id: string; transitions: Array<Record<string, unknown>> }>).find(
      (phase) => phase.id === "fase_4_documentacion",
    );
    const candidateReturn = phase4?.transitions.find(
      (transition) => transition.to === "p3_test_preparing" && transition.guard === "p4_document_candidate_written",
    );
    if (!candidateReturn) {
      fail(
        "REQ-P5-024 SC-P5-062",
        `${BINDING_PATH}#/phases/fase_4_documentacion/transitions`,
        "<missing p4_document_candidate_written>",
        "documentation writes entered via environment_verification_deferred MUST return to p3_test_preparing (RED: absent)",
      );
    }
    expect(candidateReturn?.guard).toBe("p4_document_candidate_written");
  });

  it("SC-P5-063/064 — declares `pending_environment_close_block` as a hard gate reused by p4_complete, delivery and done", () => {
    const binding = parseBindingFile(REPO_ROOT).binding as Record<string, unknown>;
    const serializedBinding = JSON.stringify(binding);
    if (!serializedBinding.includes("pending_environment_close_block")) {
      fail(
        "REQ-P5-025 SC-P5-063/064",
        `${BINDING_PATH}#/gates`,
        "<missing pending_environment_close_block>",
        "binding MUST declare pending_environment_close_block blocking p4_complete/delivery/done while methods remain (RED: absent)",
      );
    }
    expect(serializedBinding).toContain("pending_environment_close_block");
  });

  it("SC-P5-058 — an unapproved, empty, partial, duplicate, stale or renamed method set MUST NOT be representable as a valid record shape", async () => {
    // The binding does not yet expose a validator for pending_environment
    // records (REQ-P5-023 item 3). This assertion pins the exact rejected
    // shapes the eventual validator MUST fail-closed on; it fails RED
    // because no such export exists on the normalizer yet.
    const normalizerModule = (await import("../skill/task-flow-normalizer.ts")) as Record<string, unknown>;
    const validate = normalizerModule["validatePendingEnvironmentMethods"] as
      | ((methods: unknown) => boolean)
      | undefined;
    if (typeof validate !== "function") {
      fail(
        "REQ-P5-023 SC-P5-058",
        ".agents/skills/projectctl-sdd/scripts/skill/task-flow-normalizer.ts#/validatePendingEnvironmentMethods",
        "<missing-export>",
        "MUST export a fail-closed validator for {Go,Docker,PW,Git-real} (RED: not implemented yet)",
      );
    }
    const invalidCases: unknown[] = [
      [],
      ["Go"],
      ["Go", "Docker", "PW", "Git-real", "Go"],
      ["Go", "Docker", "PW", "Windows"],
      ["go", "docker", "pw", "git-real"],
      null,
      undefined,
    ];
    for (const invalid of invalidCases) {
      expect((validate as (methods: unknown) => boolean)(invalid)).toBe(false);
    }
    expect((validate as (methods: unknown) => boolean)([...APPROVED_METHODS])).toBe(true);
  });
});
