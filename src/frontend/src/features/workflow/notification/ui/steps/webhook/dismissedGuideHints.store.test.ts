import { beforeEach, describe, expect, it, vi } from 'vitest';

const KEY = 'opencelium:notification:dismissed-guide-hints';

describe('useDismissedGuideHints', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.resetModules();
	});

	it('remembers a closed hint across store instances', async () => {
		const first = (await import('./dismissedGuideHints.store')).useDismissedGuideHints;
		first.getState().dismiss('slack.1');
		first.getState().dismiss('slack.1');
		expect(JSON.parse(localStorage.getItem(KEY) ?? '[]')).toEqual(['slack.1']);

		vi.resetModules();
		const reloaded = (await import('./dismissedGuideHints.store')).useDismissedGuideHints;
		expect(reloaded.getState().dismissed).toEqual(['slack.1']);
	});

	it('ignores unreadable storage', async () => {
		localStorage.setItem(KEY, '{not json');
		const store = (await import('./dismissedGuideHints.store')).useDismissedGuideHints;
		expect(store.getState().dismissed).toEqual([]);
	});
});
