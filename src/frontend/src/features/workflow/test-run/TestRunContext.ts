import { createContext } from 'react';
import type { LiveLogTree } from '@features/logs';
import type { SocketStatus } from '@shared/api/socket/types';
import type { LiveGraphStatus } from './liveGraphStatus';

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
	// Flat per-node run status (not memory-bounded like logTree — see
	// liveGraphStatus.ts) driving the canvas's live edge/node/iteration
	// animation, keyed by workflow tree-path index.
	liveGraphStatus: LiveGraphStatus;
	result: TestRunResult | null;
	// True when the running state was resumed from a previous page session: the
	// test was started before the page was reloaded/reopened, so its logs are no
	// longer available. The stop button stays active, but the panel shows a
	// notice instead of logs (the user must stop and re-run to see fresh logs).
	isOrphaned: boolean;
	// True when a test run for a *different* workflow is currently executing on
	// the backend. Only one workflow test may run at a time system-wide, so this
	// blocks starting a test here until the other one finishes.
	isOtherTestRunning: boolean;
	// Bumped once per failed run so the logs panel can auto-expand and scroll to
	// the element where the error happened. 0 means no failure to reveal yet.
	errorRevealNonce: number;
	// True during the short pause after a failure, before the reveal starts —
	// gives the backend time to persist the run. The panel shows a loading state.
	revealPending: boolean;
	startTest: () => Promise<void>;
	stopTest: () => Promise<void>;
	// Clears the locally collected logs (and the result line). No-op while a
	// run is active — incoming lines need their connector roots.
	clearLogs: () => void;
};

export const TestRunContext = createContext<TestRunContextValue | null>(null);
