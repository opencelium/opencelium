import { useSyncExternalStore } from 'react';

/**
 * A stand-in connection for the schedules panel, so it can be taught before there is
 * anything to attach a schedule to. Registered by the workflow tutorial, which runs
 * on /workflow/create with saving suppressed: without this the pill never renders,
 * since the header only shows it once a connection exists.
 *
 * Deliberately separate from `activeConnectionId` rather than a fallback inside it.
 * That id also drives save, templates and history, and feeding it an invented value
 * would turn the next save into an update of a connection that is not there. Only the
 * pill and the panel read this one, and the tutorial answers their requests from
 * fixtures (see `requestOverrides`).
 *
 * Registration lives here rather than in the tutorial so the dependency runs
 * onboarding -> workflow, matching `simulatedTestRun`.
 */
let connectionId: string | null = null;
const listeners = new Set<() => void>();

export function setSimulatedSchedulesConnection(next: string | null): void {
	if (connectionId === next) return;
	connectionId = next;
	listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

const getSnapshot = () => connectionId;

/** The real connection when there is one, the simulated one while a tutorial runs. */
export function useSchedulesConnectionId(activeConnectionId?: string): string | undefined {
	const simulated = useSyncExternalStore(subscribe, getSnapshot, () => null);
	return activeConnectionId ?? simulated ?? undefined;
}
