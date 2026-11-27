import type { Storage } from '@graphiql/toolkit';

/**
 * GraphiQL keeps its tabs, query and variables in localStorage by default, shared by every method
 * and kept across reloads. Restored state then wins over the method's own body (a new method showed
 * empty variables although the invoker defines them), so each editor gets a store of its own.
 */
export const createGraphQlMemoryStorage = (): Storage => {
	const items = new Map<string, string>();
	return {
		getItem: (key) => items.get(key) ?? null,
		setItem: (key, value) => { items.set(key, value); },
		removeItem: (key) => { items.delete(key); },
		clear: () => { items.clear(); },
		get length() { return items.size; },
	};
};
