import type { PhaseDefinition } from '../../contracts/phase-definition.ts';
import type { StateDefinition } from '../../contracts/state-definition.ts';
import { uniqueStringArray } from '../../contracts/shared.ts';
import { z } from 'zod';

const validState: StateDefinition = { phase: 'fase_1_propuesta', state: 'p1_started' };
const validPhase: PhaseDefinition = { id: 'fase_1_propuesta', states: ['p1_started'] };
const validUniqueStrings = uniqueStringArray(z.string());

// @ts-expect-error p4_done belongs to fase_4_documentacion, not fase_1_propuesta.
const invalidState: StateDefinition = { phase: 'fase_1_propuesta', state: 'p4_done' };
// @ts-expect-error p4_done belongs to fase_4_documentacion, not fase_1_propuesta.
const invalidPhase: PhaseDefinition = { id: 'fase_1_propuesta', states: ['p4_done'] };
// @ts-expect-error Structural object equality cannot be represented by Set identity.
const unsupportedUniqueObjects = uniqueStringArray(z.object({ id: z.string() }));

void [validState, validPhase, validUniqueStrings, invalidState, invalidPhase, unsupportedUniqueObjects];
