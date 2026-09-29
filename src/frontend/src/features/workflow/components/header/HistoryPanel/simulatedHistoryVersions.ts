import { useMemo, useSyncExternalStore } from 'react';
import type { HistoryVersionItem } from '../../../types/history.types';

/**
 * Stand-in versions for the version history panel, so it can be taught on
 * /workflow/create, where nothing has ever been saved. Registered by the workflow
 * tutorial, which suppresses saving — mirrors `simulatedSchedulesConnection`.
 *
 * A builder rather than a list: the versions carry translated comments and
 * timestamps relative to now, so they are rebuilt whenever the language changes
 * instead of freezing whatever was current when the tutorial started.
 *
 * Every panel action stays inert for these: selecting, commenting, deleting and
 * downloading all go through handlers that return early without a connection id,
 * so a sample version can never load a graph or reach the backend.
 */
type VersionsBuilder = () => HistoryVersionItem[];

let builder: VersionsBuilder | null = null;
const listeners = new Set<() => void>();

export function setSimulatedHistoryVersions(next: VersionsBuilder | null): void {
	if (builder === next) return;
	builder = next;
	listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

const getSnapshot = () => builder;

/** The simulated versions while a tutorial runs, null otherwise. */
export function useSimulatedHistoryVersions(language: string): HistoryVersionItem[] | null {
	const current = useSyncExternalStore(subscribe, getSnapshot, () => null);
	// `language` is only a rebuild trigger — the builder reads the language itself.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	return useMemo(() => current?.() ?? null, [current, language]);
}
