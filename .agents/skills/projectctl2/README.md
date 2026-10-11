# projectctl2 skill package

The root [`SKILL.md`](SKILL.md) identifies the package and its aggregate version. `requirements/` contains the core rules, `sdd/` contains the task-flow satellite, and `types/` is the shared data-contract catalog. Canonical Zod contracts cover App Map navigation, per-view test records, per-type criteria maps, SDD phase/state definitions, and the `TaskDocument`. TypeScript types are inferred directly from those named schemas; generated Draft 2020-12 JSON Schemas are compatibility exports. Task criterion operations reuse Navigation's canonical criterion schema and non-empty text constraint.

## Shared types

The copied skill tree intentionally has no standalone `package.json`; dependencies are installed in the consuming Bun project, whose manifest and lockfile own reproducible resolution. Pin these compatible versions (also used by this checkout):

```sh
# Required at runtime by contracts and schema-validator.ts
bun add zod@4.6.5

# Required only to check exported JSON Schema compatibility with Draft 2020-12
bun add --dev ajv@8.17.1

# Required by verify-contracts.ts for its negative TypeScript type fixtures
bun add --dev typescript@~5.9.3
```

Zod is needed by schema generation, validation, and all runtime contract consumers. Ajv is needed by `check-generated.ts` and `verify-contracts.ts` to check Draft 2020-12 JSON Schema compatibility and runtime/Ajv parity. TypeScript is needed by `verify-contracts.ts`, which invokes `node_modules/typescript/bin/tsc` to check the canonical contracts, type scripts, and negative type fixtures. The verifier therefore requires all three packages; Ajv alone is not sufficient for the complete verification suite. Run the following commands from the repository root:

```sh
bun .agents/skills/projectctl2/types/scripts/generate-schemas.ts
bun .agents/skills/projectctl2/types/scripts/check-generated.ts
bun .agents/skills/projectctl2/types/scripts/verify-contracts.ts
bun .agents/skills/projectctl2/types/scripts/validate-data.ts --schema navigation --file docs/app-map/navigation.yaml
bun .agents/skills/projectctl2/types/scripts/validate-data.ts --schema task --file taskReadme/<task-index>.md
```

`types/contracts/*.ts` is the canonical source and each named TypeScript type is inferred with `z.infer`; no generated TypeScript declaration files or compatibility re-exports are retained. Only the Draft 2020-12 JSON Schemas in `types/generated/` are generated; do not edit them by hand. The reusable string-only `uniqueStringArray` helper declares runtime uniqueness and `uniqueItems` metadata together. `generate-schemas.ts` emits the schema metadata, while `verify-contracts.ts`, `check-generated.ts`, and tests enforce runtime/Ajv parity. Keep dependencies exactly pinned when reproducing this toolchain.

Run `bun run test:check` as the project's unified check; it includes `bun .agents/skills/projectctl2/types/scripts/verify-contracts.ts`. To run only the contract verifier, invoke that script directly. It checks generated schemas and Markdown, Draft 2020-12 references, runtime/Ajv agreement, parsed YAML and Task frontmatter CLI fixtures, and synchronization of documented SDD phase/state identifiers with `WorkflowCatalog`. The persistent fixtures live under `types/scripts/__tests__/fixtures/data`; verification reads them without mutating project test data.

For this checkout's `schema_version: 1` / `views` navigation, the local `test:coverage` gate validates the per-view test manifests and reports `sin-test`, `rojo`, and `verde` separately; red records fail the gate. Pending records are not execution evidence. `test:unit` executes package/tooling regressions, including the verifier's missing-fixture, late-failure, and misplaced-state tests. `test:check` then typechecks the frontend and verifies contracts. `docs:lint` uses the projectctl2 documentation validator and mapped-code marker validator. Legacy frontmatter gates remain available only for legacy navigation; do not add legacy fields to v2 documents to satisfy them.

### Associate JSON Schemas with YAML in VS Code

With the YAML extension (`yaml-language-server`), associate schema paths with YAML globs in VS Code's `yaml.schemas` setting. Use workspace-relative paths to the generated files, for example:

```json
"yaml.schemas": {
  "./.agents/skills/projectctl2/types/generated/navigation.schema.json": "docs/app-map/navigation.yaml",
  "./.agents/skills/projectctl2/types/generated/test-view.schema.json": "docs/app-map/*/*.yaml",
  "./.agents/skills/projectctl2/types/generated/criteria-map.schema.json": "*/criteria-map.yaml"
}
```

Map each schema to the matching YAML file pattern in your own VS Code user/workspace settings; schema generation does not create or modify editor configuration.

`validate-data.ts` accepts `navigation`, `test-view`, `criteria-map`, `task`, `phase-definition`, or `state-definition` and checks data shape after parsing YAML (or JSON); for `task`, it extracts YAML frontmatter from a Markdown index. It does not replace requirement-specific cross-document or filesystem validation.

## Change and release workflow

1. Edit one or more files inside `.agents/skills/projectctl2/`.
2. Run `bun .agents/skills/projectctl2/scripts/skill-version.ts check`. A changed tree fails because its stored SHA is stale.
3. Choose the SemVer level and run `bump patch`, `bump minor`, or `bump major`. The command increments `metadata.version` in the root `SKILL.md` and refreshes `skill-release.json`.
4. Run `check` again; it passes only when ID, version, file inventory, and SHA match.

Use `patch` for compatible fixes/clarifications, `minor` for compatible additions, and `major` for incompatible changes to skill behavior or contracts. The current package version is recorded in the root `SKILL.md` frontmatter.

Use `sha` to preview the current SHA-256 without modifying the release manifest. The SHA covers all regular files in this package tree, sorted by normalized relative path and hashed as framed raw bytes, including each file's executable bit. Symlinks and special files are rejected. `skill-release.json` is the only excluded file.

The tool validates package consistency in the current worktree; it does not use Git history as an authority.
