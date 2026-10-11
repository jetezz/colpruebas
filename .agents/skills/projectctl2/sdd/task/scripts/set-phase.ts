#!/usr/bin/env bun
import { cli, readTaskValues, runSetter } from './task-file.ts';
import { WorkflowPhaseIds, type WorkflowPhaseId } from '../../../types/contracts/workflow.ts';
import type { TaskDocument } from '../../../types/contracts/index.ts';

const phaseOrder = WorkflowPhaseIds;
const phases: ReadonlySet<WorkflowPhaseId> = new Set(phaseOrder);

// Canonical literals typed against WorkflowPhaseId / TaskDocument acceptance
// states (canonical origin: WorkflowCatalog in types/contracts/workflow.ts,
// TaskDocument in types/contracts/task.ts). Transition rules below are intact.
const FASE_1_PROPUESTA: WorkflowPhaseId = 'fase_1_propuesta';
const FASE_2_IMPLEMENTACION: WorkflowPhaseId = 'fase_2_implementacion';
const FASE_3_VERIFICACION: WorkflowPhaseId = 'fase_3_verificacion';
const PROPOSAL_APPROVE: TaskDocument['proposal_state'] = 'approve';
const FUNCTIONAL_APPROVE: TaskDocument['functional_state'] = 'approve';

function isPhase(value: string): value is WorkflowPhaseId {
  return phases.has(value as WorkflowPhaseId);
}

function hasContent(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

function setPhase(argv: string[]): void {
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write('usage: bun set-phase.ts <task-index> <phase>\n');
    return;
  }
  if (argv.length !== 2) throw new Error('usage: bun set-phase.ts <task-index> <phase>');
  const [taskFile, rawPhase] = argv as [string, string];
  if (!isPhase(rawPhase)) throw new Error(`invalid phase: ${rawPhase}`);
  const targetPhase: WorkflowPhaseId = rawPhase;

  const fields = targetPhase === FASE_2_IMPLEMENTACION
    ? ['phase', 'app_map', 'expected', 'criteria', 'branch', 'proposal_state']
    : targetPhase === FASE_3_VERIFICACION
      ? ['phase', 'functional_state']
      : ['phase'];
  const task = readTaskValues(taskFile, fields);
  if (typeof task.phase !== 'string' || !isPhase(task.phase)) throw new Error(`invalid current phase: ${String(task.phase)}`);
  const currentPhase: WorkflowPhaseId = task.phase;
  if (currentPhase === targetPhase) throw new Error(`phase is already ${targetPhase}`);
  const currentIndex = phaseOrder.indexOf(currentPhase);
  const targetIndex = phaseOrder.indexOf(targetPhase);
  if (targetIndex > currentIndex + 1) {
    throw new Error(`BLOCKED: cannot skip phases from ${task.phase} to ${targetPhase}`);
  }

  if (currentPhase === FASE_1_PROPUESTA && targetPhase === FASE_2_IMPLEMENTACION) {
    const required = ['app_map', 'expected', 'criteria', 'branch'];
    const missing = required.filter(field => !hasContent(task[field]));
    if (missing.length) {
      throw new Error(`BLOCKED: cannot move from fase_1_propuesta to fase_2_implementacion; missing information: ${missing.join(', ')}`);
    }
    if (task.proposal_state !== PROPOSAL_APPROVE) {
      throw new Error('BLOCKED: cannot move from fase_1_propuesta to fase_2_implementacion; proposal_state must be approve');
    }
  }

  if (currentPhase === FASE_2_IMPLEMENTACION && targetPhase === FASE_3_VERIFICACION) {
    if (task.functional_state !== FUNCTIONAL_APPROVE) {
      throw new Error('BLOCKED: cannot move from fase_2_implementacion to fase_3_verificacion; functional_state must be approve');
    }
  }

  runSetter(argv, 'phase', value => isPhase(value));
}

cli(() => setPhase(process.argv.slice(2)));
