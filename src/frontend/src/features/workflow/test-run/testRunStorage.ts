const STORAGE_KEY = 'oc_active_test_runs';

// A test run started on the workflow page that may outlive the page session:
// the user can close/reload the page while the backend keeps executing. We
// persist enough to (a) re-show the stop button and (b) terminate the run via
// its schedulerId after a reload. The emitted logs themselves are not replayable
// over STOMP, so they are intentionally not stored.
export type ActiveTestRun = {
	channelId: string;
	schedulerId: number | null;
	startedAt: number;
};

type ActiveTestRunMap = Record<string, ActiveTestRun>;

const readAll = (): ActiveTestRunMap => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return {};
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === 'object' ? (parsed as ActiveTestRunMap) : {};
	} catch {
		return {};
	}
};

const writeAll = (map: ActiveTestRunMap) => {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
	} catch {
		// ignore quota / disabled storage
	}
};

export const getActiveTestRun = (channelId: string): ActiveTestRun | null =>
	readAll()[channelId] ?? null;

export const saveActiveTestRun = (run: ActiveTestRun) => {
	const map = readAll();
	map[run.channelId] = run;
	writeAll(map);
};

export const clearActiveTestRun = (channelId: string) => {
	const map = readAll();
	if (!(channelId in map)) return;
	delete map[channelId];
	writeAll(map);
};
