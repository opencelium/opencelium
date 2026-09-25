import type { ExecutionSocketLog } from '@features/logs';

/**
 * A stand-in for the backend half of a test run: something that produces the same
 * `/execution/logs/{channelId}` stream a real execution would, without a POST and
 * without a socket. Registered by the workflow tutorial, which teaches the editor on
 * invented connectors — ids `-9001`/`-9002` exist nowhere, so a real run can only
 * fail, and the debugger it is meant to teach never renders while the phase is idle.
 *
 * Only the *source* of the lines is replaced. Everything downstream — the playback
 * queue's pacing, pause/step/skip, the live-graph animation, the log tree, the result
 * line — is the real implementation reading real lines, so what the tutorial teaches
 * is what the user will do against their own connectors.
 *
 * Registration lives here rather than in the tutorial so the dependency runs
 * onboarding -> workflow, matching `requestOverrides` in `shared` (there is one
 * obvious place to look when a run does not reach the network).
 */
export type SimulatedTestRun = {
	/**
	 * Begins emitting. The returned function stops the run and discards whatever is
	 * still unsent — called on stop, and on unmount so a half-played script cannot
	 * outlive the editor that was showing it.
	 */
	start: (emit: (log: ExecutionSocketLog) => void) => () => void;
};

/**
 * Given the save-shaped payload the graph builds (see `useBuildTestPayload`), the
 * run to play for it — or null to decline and let the request go to the backend.
 */
export type SimulatedTestRunFactory = (payload: unknown) => SimulatedTestRun | null;

let factory: SimulatedTestRunFactory | null = null;
const listeners = new Set<() => void>();

export function setSimulatedTestRun(next: SimulatedTestRunFactory | null): void {
	if (factory === next) return;
	factory = next;
	listeners.forEach((listener) => listener());
}

export const subscribeSimulatedTestRun = (listener: () => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

export const getSimulatedTestRun = (): SimulatedTestRunFactory | null => factory;
