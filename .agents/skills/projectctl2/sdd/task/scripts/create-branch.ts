#!/usr/bin/env bun
import { cli, projectRoot, readTaskFields, updateTaskField } from './task-file.ts';
import { TaskDocumentSchema } from '../../../types/contracts/task.ts';
import type { TaskDocument } from '../../../types/contracts/task.ts';

type GitResult = { stdout: string; stderr: string; exitCode: number };

function git(root: string, args: string[]): GitResult {
  const proc = Bun.spawnSync(['git', ...args], { cwd: root, stdout: 'pipe', stderr: 'pipe' });
  return { stdout: proc.stdout.toString(), stderr: proc.stderr.toString(), exitCode: proc.exitCode };
}

function details(result: GitResult): string {
  return `${result.stderr ?? ''}\n${result.stdout ?? ''}`.trim().replace(/\s+/g, ' ') || 'git command failed';
}

function conflictedFiles(root: string): string[] {
  const result = git(root, ['diff', '--name-only', '--diff-filter=U']);
  return result.exitCode === 0 ? [...new Set(result.stdout.split(/\r?\n/).filter(Boolean))] : [];
}

function recordBranch(taskFile: string, branch: string, context: string): void {
  try {
    updateTaskField(taskFile, 'branch', branch);
  } catch (error) {
    throw new Error(`BLOCKED: ${context}; task branch update failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function createBranch(argv: string[]): void {
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write('usage: bun create-branch.ts <task-index>\n');
    return;
  }
  if (argv.length !== 1) throw new Error('usage: bun create-branch.ts <task-index>');
  const taskFile = argv[0]!;
  const fields = ['task_id', 'task_slug', 'source_branch', 'branch'] as (keyof TaskDocument)[];
  const task = readTaskFields(taskFile, fields);
  if (!TaskDocumentSchema.shape.task_id.safeParse(task.task_id).success) throw new Error('task_id is invalid');
  if (!TaskDocumentSchema.shape.task_slug.safeParse(task.task_slug).success) throw new Error('task_slug is invalid');
  if (!task.source_branch) throw new Error('source_branch is required');
  if (task.branch) throw new Error(`task already has a branch: ${task.branch}`);

  const root = projectRoot();
  const sourceBranch = task.source_branch;
  const branch = `feature/${task.task_id}-${task.task_slug}`;
  const validSource = git(root, ['check-ref-format', '--branch', sourceBranch]);
  if (validSource.exitCode !== 0) throw new Error(`BLOCKED: invalid source_branch '${sourceBranch}'`);
  const validBranch = git(root, ['check-ref-format', '--branch', branch]);
  if (validBranch.exitCode !== 0) throw new Error(`BLOCKED: generated branch name is invalid: '${branch}'`);

  const existing = git(root, ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`]);
  if (existing.exitCode === 0) {
    const active = git(root, ['branch', '--show-current']);
    if (active.exitCode === 0 && active.stdout.trim() === branch) {
      recordBranch(taskFile, branch, `branch '${branch}' is already active`);
      process.stdout.write(`${branch}\n`);
      return;
    }
    throw new Error(`BLOCKED: branch already exists but is not active: '${branch}'`);
  }
  if (existing.exitCode !== 1) throw new Error(`BLOCKED: cannot check whether branch '${branch}' exists: ${details(existing)}`);

  const checkoutSource = git(root, ['checkout', sourceBranch]);
  if (checkoutSource.exitCode !== 0) {
    throw new Error(`BLOCKED: cannot checkout source_branch '${sourceBranch}': ${details(checkoutSource)}`);
  }

  const remote = git(root, ['config', '--get', `branch.${sourceBranch}.remote`]);
  const remoteName = remote.stdout.trim();
  if (remote.exitCode !== 0 || !remoteName) {
    throw new Error(`BLOCKED: source_branch '${sourceBranch}' has no configured remote to pull from`);
  }

  const sourceRef = `refs/heads/${sourceBranch}`;
  const pull = git(root, ['pull', remoteName, sourceRef]);
  const conflicts = conflictedFiles(root);
  if (conflicts.length) throw new Error(`BLOCKED: pull conflicts on '${sourceBranch}': ${conflicts.join(', ')}`);
  if (pull.exitCode !== 0) throw new Error(`BLOCKED: pull failed on '${sourceBranch}': ${details(pull)}`);

  const checkoutBranch = git(root, ['checkout', '-b', branch]);
  if (checkoutBranch.exitCode !== 0) {
    throw new Error(`BLOCKED: cannot create branch '${branch}': ${details(checkoutBranch)}`);
  }

  // Record the branch immediately after checkout -b, before reporting success.
  recordBranch(taskFile, branch, `branch '${branch}' was created`);

  process.stdout.write(`${branch}\n`);
}

cli(() => createBranch(process.argv.slice(2)));
