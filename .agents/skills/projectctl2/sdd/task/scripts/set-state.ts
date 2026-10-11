#!/usr/bin/env bun
import { cli, readTaskValues, runSetter } from './task-file.ts';
import { TaskDocumentSchema } from '../../../types/contracts/task.ts';
import { WorkflowCatalog, type WorkflowPhaseId, type WorkflowState } from '../../../types/contracts/workflow.ts';

const p4Phase = 'fase_4_documentacion' as const satisfies WorkflowPhaseId;
const p4Done = 'p4_done' as const satisfies WorkflowState;

cli(() => {
  const argv = process.argv.slice(2);
  if (argv.length === 2 && argv[1] === p4Done) {
    const task = readTaskValues(argv[0]!, ['phase', 'pr']);
    if (task.phase !== p4Phase) {
      throw new Error('BLOCKED: p4_done requires phase fase_4_documentacion');
    }
    if (typeof task.pr !== 'string' || !task.pr.trim()) {
      throw new Error('BLOCKED: p4_done requires a non-empty pr link');
    }
  }
  runSetter(argv, 'state', value => TaskDocumentSchema.shape.state.safeParse(value).success);
});
