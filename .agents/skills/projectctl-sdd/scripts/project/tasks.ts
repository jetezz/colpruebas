#!/usr/bin/env bun
/** Portable task operator. Run from any checkout containing the SDD satellite and locator. */
import { TaskEngine } from './task-engine.ts';

const usage = `Usage: bun .agents/skills/projectctl-sdd/scripts/project/tasks.ts [--root DIR] <command> ...

  init --id ID --slug SLUG --title TITLE --problem TEXT --app-map PATH
  validate FILE | transitions FILE | check FILE | transition FILE --to STATE
  evidence add FILE --id EVIDENCE_ID --ref EXISTING_FILE
  proposal check FILE [--stage baseline|applied]
  proposal accept FILE --actor ACTOR --message LITERAL --revision PROPOSAL_SHA256 [--criteria CANONICAL-ID,CANONICAL-ID]
  criteria baseline FILE --targets VIEW[:FEATURE],VIEW[:FEATURE]
  functionality accept FILE --actor ACTOR --message LITERAL --revision REVISION
  branch create FILE | branch verify FILE | pr record FILE --url URL
  browser set FILE --environment ENV --base-url URL --runtime-kind KIND --credentials-ref REF
  mode set FILE --name review_mode|delivery_mode --value VALUE
  checkpoint set FILE --last-action TEXT --next-action TEXT [--artifact REF]
  outcome blocked|failed FILE --reason TEXT | outcome resume FILE
  artifact record FILE --kind KIND --ref PATH --summary TEXT
  work-unit set FILE --id WU-ID --lane LANE --apply-lane LANE --status STATUS [--ref PATH]
  criteria set FILE --id CANONICAL-ID --verdict VERDICT --method METHOD [--ref PATH]
  verification record FILE --lane LANE --verdict VERDICT [--ref PATH]
  requirements targets FILE --targets VIEW[:FEATURE],VIEW[:FEATURE]
  requirements snapshot FILE --target VIEW[:FEATURE]
  requirements status FILE
  requirements record FILE --profile technical|documentary --target VIEW[:FEATURE] --ref ARTIFACT
  skills set FILE --ids id-1,id-2
  environment defer FILE --actor ACTOR --reason TEXT --revision REVISION
  environment complete FILE --method METHOD --revision REVISION --ref EVIDENCE_FILE

Transitions evaluate binding guards against indexed evidence. 'evidence add' records
an existing project artifact reference; it does not run or certify its checks.
Only sdd-orchestrator should operate these commands on an active SDD task.`;

function parse(args: string[]): { args: string[]; flags: Record<string, string> } {
  const flags: Record<string, string> = {};
  const positional: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg.startsWith('--')) {
      if (!args[i + 1] || args[i + 1]!.startsWith('--') || Object.hasOwn(flags, arg.slice(2))) throw new Error(`missing or duplicated ${arg}`);
      flags[arg.slice(2)] = args[++i]!;
    } else positional.push(arg);
  }
  return { args: positional, flags };
}
function flag(flags: Record<string, string>, name: string): string {
  const value = flags[name];
  if (!value) throw new Error(`--${name} is required`);
  return value;
}
export function run(argv: string[]): unknown {
  if (argv.includes('--help') || argv.includes('-h') || !argv.length) return usage;
  const { args, flags } = parse(argv);
  const [command, ...rest] = args;
  const engine = new TaskEngine(flags.root ?? process.cwd());
  const file = rest[0];
  if (command === 'init') return { file: engine.init({ id: flag(flags, 'id'), slug: flag(flags, 'slug'), title: flag(flags, 'title'), problem: flag(flags, 'problem'), appMap: flag(flags, 'app-map') }) };
  if (!file && command !== 'evidence' && command !== 'proposal' && command !== 'functionality' && command !== 'branch' && command !== 'pr' && command !== 'browser' && command !== 'mode' && command !== 'checkpoint' && command !== 'outcome' && command !== 'artifact' && command !== 'work-unit' && command !== 'criteria' && command !== 'verification' && command !== 'skills' && command !== 'environment') throw new Error('task file required');
  if (command === 'validate') return { ok: engine.validate(file!).length === 0, issues: engine.validate(file!) };
  if (command === 'check' || command === 'transitions') return engine.inspect(file!);
  if (command === 'transition') return engine.transition(file!, flag(flags, 'to'));
  const sub = rest[0]; const subfile = rest[1];
  if (!subfile) throw new Error('task file required');
  if (command === 'requirements' && sub === 'targets') { engine.requirementsTargets(subfile, flag(flags, 'targets').split(',')); return { ok: true }; }
  if (command === 'requirements' && sub === 'snapshot') return engine.requirementsInputs(subfile, flag(flags, 'target'));
  if (command === 'requirements' && sub === 'status') return engine.requirementsStatus(subfile);
  if (command === 'requirements' && sub === 'record') {
    const profile = flag(flags, 'profile');
    if (profile !== 'technical' && profile !== 'documentary') throw new Error('invalid requirements profile');
    engine.requirementsRecord(subfile, profile, flag(flags, 'target'), flag(flags, 'ref')); return { ok: true };
  }
  if (command === 'evidence' && sub === 'add') { engine.evidence(subfile, flag(flags, 'id'), flag(flags, 'ref')); return { ok: true }; }
  if (command === 'criteria' && sub === 'baseline') {
    const issues = engine.validate(subfile); if (issues.length) throw new Error(issues.join('; '));
    return { schema: 'criteria-baseline/v1', targets: flag(flags, 'targets').split(','), baseline: engine.criteriaBaseline(flag(flags, 'targets').split(',')) };
  }
  if (command === 'proposal' && sub === 'check') {
    const stage = flags.stage ?? 'baseline';
    if (stage !== 'baseline' && stage !== 'applied') throw new Error('invalid criteria stage');
    return engine.proposalCheck(subfile, stage);
  }
  if (command === 'proposal' && sub === 'accept') { engine.accept(subfile, 'proposal', flag(flags, 'actor'), flag(flags, 'message'), flag(flags, 'revision'), flags.criteria ? flags.criteria.split(',') : []); return { ok: true }; }
  if (command === 'functionality' && sub === 'accept') { engine.accept(subfile, 'functionality', flag(flags, 'actor'), flag(flags, 'message'), flag(flags, 'revision'), []); return { ok: true }; }
  if (command === 'branch' && sub === 'create') return { branch: engine.branch(subfile) };
  if (command === 'branch' && sub === 'verify') return { branch: engine.branchVerify(subfile) };
  if (command === 'pr' && sub === 'record') { engine.pr(subfile, flag(flags, 'url')); return { ok: true }; }
  if (command === 'browser' && sub === 'set') { engine.browser(subfile, { environment: flag(flags, 'environment'), baseUrl: flag(flags, 'base-url'), runtimeKind: flag(flags, 'runtime-kind'), credentialsRef: flag(flags, 'credentials-ref') }); return { ok: true }; }
  if (command === 'mode' && sub === 'set') { const name = flag(flags, 'name'); if (name !== 'review_mode' && name !== 'delivery_mode') throw new Error('invalid mode name'); engine.mode(subfile, name, flag(flags, 'value')); return { ok: true }; }
  if (command === 'checkpoint' && sub === 'set') { engine.checkpoint(subfile, flag(flags, 'last-action'), flag(flags, 'next-action'), flags.artifact); return { ok: true }; }
  if (command === 'outcome' && ['blocked', 'failed', 'resume'].includes(sub)) { engine.outcome(subfile, sub as 'blocked' | 'failed' | 'resume', flags.reason); return { ok: true }; }
  if (command === 'artifact' && sub === 'record') { engine.artifact(subfile, flag(flags, 'kind'), flag(flags, 'ref'), flag(flags, 'summary')); return { ok: true }; }
  if (command === 'work-unit' && sub === 'set') { engine.workUnit(subfile, flag(flags, 'id'), flag(flags, 'lane'), flag(flags, 'apply-lane'), flag(flags, 'status'), flags.ref ?? ''); return { ok: true }; }
  if (command === 'criteria' && sub === 'set') { engine.criterion(subfile, flag(flags, 'id'), flag(flags, 'verdict'), flag(flags, 'method'), flags.ref); return { ok: true }; }
  if (command === 'verification' && sub === 'record') { engine.verification(subfile, flag(flags, 'lane'), flag(flags, 'verdict'), flags.ref ?? ''); return { ok: true }; }
  if (command === 'skills' && sub === 'set') { engine.skills(subfile, flags.ids ? flags.ids.split(',') : []); return { ok: true }; }
  if (command === 'environment' && sub === 'defer') { engine.environmentDefer(subfile, flag(flags, 'actor'), flag(flags, 'reason'), flag(flags, 'revision')); return { ok: true }; }
  if (command === 'environment' && sub === 'complete') { engine.environmentComplete(subfile, flag(flags, 'method'), flag(flags, 'revision'), flag(flags, 'ref')); return { ok: true }; }
  throw new Error(`unknown command: ${args.join(' ')}`);
}
if (import.meta.main) {
  try {
    const result = run(process.argv.slice(2));
    console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
    if (typeof result === 'object' && result && 'ok' in result && result.ok === false) process.exitCode = 1;
  } catch (error) {
    console.error(`[sdd-tasks] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
