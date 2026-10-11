#!/usr/bin/env bun
import { randomBytes } from 'node:crypto';
import { closeSync, existsSync, mkdirSync, openSync, rmdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateDocument } from '../../../types/scripts/schema-validator.ts';
import { slugify } from '../../../types/scripts/slugify.ts';
import type { TaskDocument, WorkflowPhaseId, WorkflowState } from '../../../types/contracts/index.ts';

const usage = 'usage: bun init.ts <task_name> <current_problem> [source_branch] [--skills <path> ...] [--requirements-fix[=true|false]]';

function fail(message: string, code = 2): never {
  process.stderr.write(`${message}\n`);
  process.exit(code);
}

function projectRoot(): string {
  const proc = Bun.spawnSync(['git', 'rev-parse', '--show-toplevel'], {
    cwd: process.cwd(),
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const stdoutText = proc.stdout.toString();
  if (proc.exitCode !== 0 || !stdoutText.trim()) fail('must run inside a git project');
  return stdoutText.trim();
}

// Canonical origin: TaskDocument['task_slug'] (/^[a-z0-9]+(?:-[a-z0-9]+)*$/, types/contracts/task.ts).
// Slug core is canonical (types/scripts/slugify.ts); truncation + fallback stay here by design.
// Local toSlug kept intentionally; validateDocument('task') below enforces the pattern.
function toSlug(value: string): string {
  return slugify(value).slice(0, 80).replace(/-+$/g, '') || 'task';
}

function createTask(nameInput: string, problemInput: string, sourceInput: string | undefined, skills: string[], requirementsFix: boolean): string {
  const name = nameInput.trim();
  const problem = problemInput.trim();
  if (!name || !problem) fail('task_name and current_problem are required');

  const root = projectRoot();
  const sourceBranch = sourceInput?.trim() || 'develop';
  const slug = toSlug(name);
  const taskReadme = join(root, 'taskReadme');
  mkdirSync(taskReadme, { recursive: true });

  // Canonical origin: TaskDocument['task_id'] (/^\d{8}-[a-z0-9]{4,8}$/, types/contracts/task.ts).
  // YYYYMMDD prefix + 3 random bytes as hex (6 chars, within 4-8); validateDocument('task') below enforces it.
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  let taskId = '';
  let taskDir = '';
  let taskFile = '';
  let dirCreated = false;

  for (let attempt = 0; attempt < 20; attempt++) {
    taskId = `${date}-${randomBytes(3).toString('hex')}`;
    const base = `${taskId}-${slug}`;
    taskDir = join(taskReadme, base);
    taskFile = join(taskReadme, `${base}.md`);
    if (existsSync(taskDir) || existsSync(taskFile)) continue;
    try {
      mkdirSync(taskDir);
      dirCreated = true;
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    }
  }

  if (!dirCreated) fail('could not allocate a unique task id', 1);

  const yamlString = (value: string) => JSON.stringify(value);
  // Canonical origin: TaskDocument['phase'] (= WorkflowPhaseId, keys of WorkflowCatalog
  // in types/contracts/workflow.ts), TaskDocument['state'] (= WorkflowState),
  // TaskDocument['proposal_state' | 'functional_state'] (enums in types/contracts/task.ts).
  const initialPhase: WorkflowPhaseId = 'fase_1_propuesta';
  const initialState: WorkflowState = 'p1_started';
  const initialProposalState: TaskDocument['proposal_state'] = 'not-init';
  const initialFunctionalState: TaskDocument['functional_state'] = 'not-init';
  const initialRequirementsFix = requirementsFix;
  const taskDocument: TaskDocument = {
    task_id: taskId,
    task_slug: slug,
    task_name: name,
    current_problem: problem,
    ui_url: '',
    skills,
    app_map: '',
    expected: '',
    criteria: [],
    source_branch: sourceBranch,
    branch: '',
    pr: '',
    phase: initialPhase,
    state: initialState,
    proposal_state: initialProposalState,
    functional_state: initialFunctionalState,
    requirements_fix: initialRequirementsFix,
  };
  const validation = validateDocument('task', taskDocument);
  if (!validation.valid) fail(`generated task is invalid: ${validation.issues.map(issue => `${issue.path} ${issue.message}`).join('; ')}`, 1);

  const content = [
    '---',
    `task_id: ${yamlString(taskDocument.task_id)}`,
    `task_slug: ${yamlString(taskDocument.task_slug)}`,
    `task_name: ${yamlString(taskDocument.task_name)}`,
    `current_problem: ${yamlString(taskDocument.current_problem)}`,
    `ui_url: ${JSON.stringify(taskDocument.ui_url)}`,
    `skills: ${JSON.stringify(taskDocument.skills)}`,
    `app_map: ${JSON.stringify(taskDocument.app_map)}`,
    `expected: ${JSON.stringify(taskDocument.expected)}`,
    `criteria: ${JSON.stringify(taskDocument.criteria)}`,
    `source_branch: ${yamlString(taskDocument.source_branch)}`,
    `branch: ${JSON.stringify(taskDocument.branch)}`,
    `pr: ${yamlString(taskDocument.pr)}`,
    `phase: ${yamlString(taskDocument.phase)}`,
    `state: ${yamlString(taskDocument.state)}`,
    `proposal_state: ${yamlString(taskDocument.proposal_state)}`,
    `functional_state: ${yamlString(taskDocument.functional_state)}`,
    `requirements_fix: ${JSON.stringify(taskDocument.requirements_fix)}`,
    '---',
    '',
  ].join('\n');

  try {
    const fd = openSync(taskFile, 'wx', 0o600);
    try {
      writeFileSync(fd, content, 'utf8');
    } finally {
      closeSync(fd);
    }
  } catch (error) {
    if (dirCreated && !existsSync(taskFile)) rmdirSync(taskDir);
    throw error;
  }

  return `taskReadme/${taskId}-${slug}.md`;
}

function main(argv: string[]): void {
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(`${usage}\n`);
    return;
  }
  if (argv.length < 2) fail(usage);
  try {
    let index = 2;
    let sourceBranch: string | undefined;
    if (index < argv.length && !argv[index]!.startsWith('--')) sourceBranch = argv[index++];

    const skills: string[] = [];
    let requirementsFix = false;
    let requirementsFixSeen = false;
    while (index < argv.length) {
      const arg = argv[index]!;
      if (arg === '--requirements-fix' || arg.startsWith('--requirements-fix=')) {
        if (requirementsFixSeen) fail(`option supplied more than once: --requirements-fix\n${usage}`);
        requirementsFixSeen = true;
        if (arg === '--requirements-fix') {
          requirementsFix = true;
        } else {
          const value = arg.slice('--requirements-fix='.length).trim().toLowerCase();
          if (value !== 'true' && value !== 'false') fail(`--requirements-fix expects true or false, got: ${arg}\n${usage}`);
          requirementsFix = value === 'true';
        }
        index++;
        continue;
      }
      if (arg !== '--skills') fail(`unknown option: ${arg}\n${usage}`);
      index++;
      const start = index;
      while (index < argv.length && !argv[index]!.startsWith('--')) {
        const path = argv[index]!.trim();
        if (!path) fail('skill paths must be non-empty');
        skills.push(path);
        index++;
      }
      if (index === start) fail('--skills requires at least one path');
    }

    // Replicates uniqueItems of TaskDocument['skills'] (uniqueStringArray in types/contracts/shared.ts);
    // kept as a fast pre-check — validateDocument('task') above remains the validator.
    if (new Set(skills).size !== skills.length) fail('skill paths must be unique');
    process.stdout.write(`${createTask(argv[0]!, argv[1]!, sourceBranch, skills, requirementsFix)}\n`);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error), 1);
  }
}

main(process.argv.slice(2));
