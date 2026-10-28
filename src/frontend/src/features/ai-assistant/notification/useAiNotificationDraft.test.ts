import { describe, expect, it } from 'vitest';
import { placeholdersOf } from './useAiNotificationDraft';

const aggregator = {
	id: 3, name: 'SyncStats', script: '', active: true,
	args: [{ id: 7, name: 'failedCount', description: 'records that failed' }, { id: 8, name: 'title', description: '' }],
};

describe('placeholdersOf', () => {
	it('offers the selected aggregator arguments as the template editors write them', () => {
		expect(placeholdersOf(aggregator)).toEqual([
			{ token: '{{SyncStats.failedCount}}', description: 'records that failed' },
			{ token: '{{SyncStats.title}}', description: '' },
		]);
	});

	it('offers nothing without an aggregator or for an inactive one, whose values the editors mark as missing', () => {
		expect(placeholdersOf(undefined)).toEqual([]);
		expect(placeholdersOf({ ...aggregator, active: false })).toEqual([]);
	});
});
