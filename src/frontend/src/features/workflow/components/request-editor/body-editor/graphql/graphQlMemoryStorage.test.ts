import { describe, expect, it } from 'vitest';
import { createGraphQlMemoryStorage } from './graphQlMemoryStorage';

describe('createGraphQlMemoryStorage', () => {
	it('keeps values for its own editor only', () => {
		const first = createGraphQlMemoryStorage();
		const second = createGraphQlMemoryStorage();

		first.setItem('graphiql:tabState', '{"tabs":[]}');

		expect(first.getItem('graphiql:tabState')).toBe('{"tabs":[]}');
		expect(first.length).toBe(1);
		expect(second.getItem('graphiql:tabState')).toBeNull();
	});

	it('does not touch localStorage', () => {
		localStorage.removeItem('graphiql:variables');
		createGraphQlMemoryStorage().setItem('graphiql:variables', '{"code":"AN"}');

		expect(localStorage.getItem('graphiql:variables')).toBeNull();
	});

	it('removes and clears values', () => {
		const storage = createGraphQlMemoryStorage();
		storage.setItem('a', '1');
		storage.setItem('b', '2');

		storage.removeItem('a');
		expect(storage.getItem('a')).toBeNull();
		storage.clear();
		expect(storage.length).toBe(0);
	});
});
