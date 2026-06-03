import { createContext } from 'react';
import type { LiveLogTree } from '@features/logs';
import type { SocketStatus } from '@shared/api/socket/types';

export type TestRunPhase = 'idle' | 'starting' | 'running' | 'stopping';

// Outcome of the last run, shown under the logs view. `executionTimeMs` is
// measured from the moment the user pressed "Test run". The error details are
// shown on the failing row inside the tree, not here.
export type TestRunResult =
	| { kind: 'finished'; executionTimeMs: number }
	| { kind: 'stopped' }
	| { kind: 'failed' };

export type TestRunContextValue = {
	socketStatus: SocketStatus;
	phase: TestRunPhase;
	// Log tree of the current (or last finished) test run, assembled entirely
	// from the socket stream — no REST requests happen during a run.
	logTree: LiveLogTree;
	result: TestRunResult | null;
	startTest: () => Promise<void>;
	stopTest: () => Promise<void>;
	// Clears the locally collected logs (and the result line). No-op while a
	// run is active — incoming lines need their connector roots.
	clearLogs: () => void;
};

export const TestRunContext = createContext<TestRunContextValue | null>(null);
