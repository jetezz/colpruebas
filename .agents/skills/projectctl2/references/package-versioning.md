# Package validation and versioning for `projectctl2`

How to check and release the `projectctl2` tree. The root `SKILL.md` keeps only the link; the operational detail lives here.

Every file change inside the package changes the SHA. After editing, run the checker; it fails until the tree is released with a bump.

```sh
# Validate the current version and SHA
bun .agents/skills/projectctl2/scripts/skill-version.ts check

# Preview the SHA-256 without changing package files
bun .agents/skills/projectctl2/scripts/skill-version.ts sha

# Release a compatible fix, addition, or breaking change
bun .agents/skills/projectctl2/scripts/skill-version.ts bump patch
bun .agents/skills/projectctl2/scripts/skill-version.ts bump minor
bun .agents/skills/projectctl2/scripts/skill-version.ts bump major

# Create the initial release manifest (once)
bun .agents/skills/projectctl2/scripts/skill-version.ts init
```

`bump` updates the SemVer version and SHA manifest together. `patch`, `minor`, and `major` follow SemVer 2.0.0; `patch` is the hotfix level. `skill-release.json` stores the latest tree digest and is excluded from its own calculation.
