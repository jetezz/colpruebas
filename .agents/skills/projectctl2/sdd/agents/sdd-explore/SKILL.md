---
name: projectctl2-sdd-explore
description: Investigate an SDD v2 task problem in code and, when relevant, external sources or UI; return findings and evidence to sdd-orchestrator without modifying the project. Use when sdd-orchestrator delegates exploration during p1_exploring.
---

# SDD v2 — sdd-explore

## Purpose

Investigate the problem during `p1_exploring` and return enough evidence to `sdd-orchestrator` to understand the current behavior and prepare a precise proposal. This skill combines three capabilities in a single exploration, activated per task: code analysis, external research, and UI observation.

Exploration provides context for the proposal; it neither drafts nor accepts the proposal itself. Proposal synthesis belongs to `sdd-propose`; phase, state, and acceptance changes belong exclusively to the orchestrator.

## Expected input

The orchestrator provides:

- the goal or problem to investigate;
- the relevant context and scope of the current task;
- any specific questions to resolve before preparing the proposal.
- the current `Task.ui_url` value, even when `""`; it is optional data and does not imply opening a browser.

If essential information for investigating the problem is missing, tell the orchestrator which datum is missing. Do not expand the scope on your own or interview the user directly.

## Exploration method

### 1. Clarify the problem and context

Summarize which behavior, need, or problem is under investigation and which constraints are known. Separate provided facts from assumptions that still require verification.

### 2. Investigate the code

Inspect the relevant code and, depending on the problem, the project tests and documentation. Identify:

- the current behavior and its entry points;
- the related modules and files, citing concrete paths and symbols;
- existing patterns, dependencies, and limits that may affect a solution;
- existing tests and which behavior they cover;
- observable impact surfaces and risks.

Read real sources before stating how the system works. Distinguish direct observations clearly from inferences.

### 3. Investigate external sources when they add evidence

Phase 1 exploration includes relevant external context in addition to code. Choose sources according to the question; do not force irrelevant lookups just to satisfy a list.

- When the task depends on a library, framework, SDK, API, or service, consult Context7 when available and use the applicable current documentation.
- For domain facts, external behavior, or information not covered by technical documentation, use web search when available and prefer primary sources.
- Include a URL or identifiable reference for relevant external claims. Flag age, contradictions, limitations, and facts you could not verify.
- When no relevant external source exists or the tool is unavailable, say so; do not claim you consulted sources you could not open.

### 4. Observe UI only when the problem requires it

When the task genuinely requires observing interface behavior, use `ui_url` as the target and the browser capability the orchestrator enabled. When `ui_url` is empty, do not invent a URL or block exploration: continue the code and research analysis and report that UI observation was not possible for lack of a target. When the task needs no UI observation, do not open a browser. Describe only steps and results actually observed; when no browser is available, report that limitation. Do not persist artifacts automatically or require Engram.

### 5. Compare alternatives only when they exist

When the evidence supports more than one reasonable solution, summarize the real alternatives with advantages, disadvantages, relative complexity, and risks. When only one reasonable path exists or information is still missing for a comparison, say so without fabricating options or making a product decision for the user.

### 6. Engram as auxiliary memory

Engram is best-effort and parallel, never a gate; see [engram-policy](../../references/engram-policy.md). Task/canonical first, Engram second. Reads: `mem_context` on resume, narrow `mem_search` + full `mem_get_observation(id)`; treat results as historical and confirm them. Selective post-result saves with `capture_prompt: false`, `scope: project`, `What/Why/Where/Learned`; do not mirror artifacts; on failure, continue and report. Saving ≠ replying.

Flow and guards: see [phases](../../phases/SKILL.md) and [flow-guards](../../references/flow-guards.md).

## Boundaries

- Do not modify code, tests, Task frontmatter, or existing documentation.
- Do not run `sdd/task` or change `phase`, `state`, `proposal_state`, or `functional_state`.
- Do not delegate internally. The orchestrator selects and launches this skill, evaluates whether the result is valid, and decides whether a correction or a block is needed.
- Do not accept the proposal or claim the task is ready to advance on your own authority. You may state whether the evidence looks sufficient for the orchestrator to prepare a proposal, keeping any uncertainty visible.
- Return results to the orchestrator; do not create `exploration.md` or any other persistence path not defined by the artifact-owning skill.

## Response format

Return a concise report. Respond in English, using these sections:

```markdown
## Exploration: {topic}

### Understood problem and scope
{What was asked to investigate and what stays out}

### Current code and behavior
- `path/to/file` — {verifiable finding and its relevance}

### External evidence
- {Source/URL or Context7 reference, finding, and limitations}
- {State whether no relevant source existed or could be consulted}

### Observed UI
{Only when applicable; steps and observed behavior, or access limitation}

### Affected areas and risks
- {Area or file — likely impact/risk}

### Alternatives
{Only real options; state pros, cons, and complexity, or explain why comparison does not apply}

### Implications for the proposal
{Facts, pending decisions, and questions the proposal must resolve}
```

Do not fill sections with assumptions. Keep observed, inferred, and pending-user-decision content separate.
