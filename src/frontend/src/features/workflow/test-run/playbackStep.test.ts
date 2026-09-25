import { describe, expect, it } from 'vitest';
import type { ExecutionSocketLog } from '@features/logs';
import { getNextStep, isStepLine } from './playbackStep';

const line = (
	type: string,
	status: string,
	indexPath: string | null,
	loopIndex?: string,
): ExecutionSocketLog =>
	({
		type,
		status,
		indexPath,
		connectorName: null,
		properties: loopIndex ? { loopIndex } : null,
		segment: null,
		error: null,
	} as unknown as ExecutionSocketLog);

describe('isStepLine', () => {
	it('treats operator PENDING lines as steps', () => {
		expect(isStepLine(line('LOOP', 'PENDING', '1'))).toBe(true);
		expect(isStepLine(line('IF', 'PENDING', '1_0_0', '0,0'))).toBe(true);
	});

	it('treats a method COMPLETE as its step — methods never emit PENDING', () => {
		expect(isStepLine(line('OPERATION', 'COMPLETE', '0'))).toBe(true);
	});

	it('never steps on operator COMPLETE lines or lines without an indexPath', () => {
		expect(isStepLine(line('IF', 'COMPLETE', '1_0_0', '0,0'))).toBe(false);
		expect(isStepLine(line('LOOP', 'COMPLETE', '1_0_2_0', '0,0,0'))).toBe(false);
		expect(isStepLine(line('EXECUTION', 'PENDING', null))).toBe(false);
	});
});

describe('getNextStep', () => {
	it('moves the token onto a method via its COMPLETE line', () => {
		const next = getNextStep(line('OPERATION', 'COMPLETE', '1_0_1', '0,0'), {
			indexPath: '1_0_0',
			loopIndex: '0,0',
		});
		expect(next).toEqual({ indexPath: '1_0_1', loopIndex: '0,0' });
	});

	it('ignores a duplicate line for the step the token is already on', () => {
		expect(
			getNextStep(line('IF', 'PENDING', '1_0_0', '0,0'), { indexPath: '1_0_0', loopIndex: '0,0' }),
		).toBeNull();
	});

	it('skips a stale out-of-order line for an earlier element of the same iteration', () => {
		// Observed live: the sibling IF's PENDING arrives before the method's
		// COMPLETE — stepping back onto the method would hop the token backwards.
		expect(
			getNextStep(line('OPERATION', 'COMPLETE', '1_0_2_0_0', '0,0,1,3'), {
				indexPath: '1_0_2_0_1',
				loopIndex: '0,0,1,3',
			}),
		).toBeNull();
	});

	it('allows the wrap-around to the next iteration even though it moves backwards in the tree', () => {
		const next = getNextStep(line('LOOP', 'PENDING', '1_0_2_0', '0,0,2'), {
			indexPath: '1_0_2_0_1',
			loopIndex: '0,0,1,16',
		});
		expect(next).toEqual({ indexPath: '1_0_2_0', loopIndex: '0,0,2' });
	});

	it('compares tree paths numerically, not lexicographically', () => {
		// "1_0_10" must count as AFTER "1_0_2" (forward), not before it.
		const next = getNextStep(line('OPERATION', 'COMPLETE', '1_0_10', '0'), {
			indexPath: '1_0_2',
			loopIndex: '0',
		});
		expect(next).toEqual({ indexPath: '1_0_10', loopIndex: '0' });
	});
});
