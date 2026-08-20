import { describe, expect, it } from 'vitest';
import type { Connection } from '../../../types/connection';
import type { LiveLogTree } from '@features/logs';
import type { LiveGraphStatus } from '../../../test-run/liveGraphStatus';
import { canInspectLiveReference, type TestRunLiveSnapshot } from './useLiveReferenceValue';
import type { ParsedArg } from './parseEnhancementArg';

// Two methods on the source connector; only "blue" (index "0") has run.
const connection = {
	fromConnector: {
		method: [
			{ id: 'm-blue', index: '0', color: '#blue' },
			{ id: 'm-red', index: '1', color: '#red' },
		],
	},
} as unknown as Connection;

const liveGraphStatus: LiveGraphStatus = {
	'0': { status: 'COMPLETE' },
	'1': { status: 'PENDING' },
} as unknown as LiveGraphStatus;

const pausedSnapshot: TestRunLiveSnapshot = {
	isPaused: true,
	logTree: {} as unknown as LiveLogTree,
	liveGraphStatus,
	loopAncestorsByIndexPath: new Map(),
};

const responseRef = (color: string): ParsedArg => ({
	color,
	direction: 'response',
	messageProperty: 'body',
	path: 'id',
});

// The method the reference is embedded in — "red", which hasn't run yet.
const currentMethod = { index: '1', color: '#red' };

describe('canInspectLiveReference', () => {
	it('marks a reference whose target method has already completed this run', () => {
		expect(canInspectLiveReference(responseRef('#blue'), connection, currentMethod, pausedSnapshot)).toBe(true);
	});

	it('rejects a reference whose target method has not run yet', () => {
		expect(canInspectLiveReference(responseRef('#red'), connection, currentMethod, pausedSnapshot)).toBe(false);
	});

	it('rejects a colour that matches no method', () => {
		expect(canInspectLiveReference(responseRef('#green'), connection, currentMethod, pausedSnapshot)).toBe(false);
	});

	it('rejects everything while the run is not paused', () => {
		expect(
			canInspectLiveReference(responseRef('#blue'), connection, currentMethod, { ...pausedSnapshot, isPaused: false }),
		).toBe(false);
	});

	it('rejects everything before the live trees have arrived', () => {
		expect(
			canInspectLiveReference(responseRef('#blue'), connection, currentMethod, { ...pausedSnapshot, logTree: undefined }),
		).toBe(false);
	});

	it('resolves a request-direction reference against the embedding method itself', () => {
		const ownRequest: ParsedArg = { color: '#blue', direction: 'request', messageProperty: 'body', path: 'id' };
		// Embedded in "blue" (COMPLETE) — its own captured request is readable.
		expect(canInspectLiveReference(ownRequest, connection, { index: '0', color: '#blue' }, pausedSnapshot)).toBe(true);
		// A request reference naming a *different* method has no captured request.
		expect(canInspectLiveReference(ownRequest, connection, currentMethod, pausedSnapshot)).toBe(false);
	});

	it('rejects a missing reference', () => {
		expect(canInspectLiveReference(null, connection, currentMethod, pausedSnapshot)).toBe(false);
	});
});
