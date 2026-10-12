import { describe, expect, it } from 'vitest';
import { findEntryForSavedNode, findSavedNode } from './connectionMapper.savedNodeMatching';
import type { IndexedWorkflowEntry, SavedUiNode } from './connectionMapper.types';

const entry = (id: string, index: string, connectorId = 20): IndexedWorkflowEntry => ({
	index,
	path: index.split('_').map(Number),
	source: { id, index, name: 'read' },
	node: {
		id,
		type: 'connector',
		position: { x: 0, y: 0 },
		data: { title: 'read', kind: 'connector', connector: { connectorId, title: 'API' }, subtitle: 'read' },
	},
});
const saved = (id: string, index?: string, connectorId = 20): SavedUiNode => ({
	id,
	index,
	type: 'connector',
	name: 'read',
	position: { x: 300, y: 180 },
	data: { title: 'read', kind: 'connector', connector: { connectorId, title: 'API' } },
});

describe('saved node matching', () => {
	it('uses indexes to distinguish repeated methods on the same connector', () => {
		const first = saved('first', '0_0');
		const second = saved('second', '0_1');
		const method = entry('new', '0_1');
		expect(findSavedNode(method.node, method, [first, second], new Set())).toBe(second);
		expect(findEntryForSavedNode(second, [entry('a', '0_0'), method], new Set())).toBe(method);
	});
	it('matches a unique method by replacement connector when IDs and indexes differ', () => {
		const method = entry('new', '1');
		const node = saved('old');
		expect(findSavedNode(method.node, method, [node], new Set())).toBe(node);
		expect(findEntryForSavedNode(node, [method], new Set())).toBe(method);
	});
	it('does not guess between identical methods without identifiers', () => {
		const method = entry('new', '1');
		expect(findSavedNode(method.node, method, [saved('old-a'), saved('old-b')], new Set())).toBeUndefined();
		expect(findEntryForSavedNode(saved('old'), [entry('a', '0'), method], new Set())).toBeUndefined();
	});
	it('does not match methods from a different connector', () => {
		const method = entry('new', '1');
		const node = saved('old', undefined, 30);
		expect(findSavedNode(method.node, method, [node], new Set())).toBeUndefined();
		expect(findEntryForSavedNode(node, [method], new Set())).toBeUndefined();
	});
	it('does not reuse nodes or entries already matched', () => {
		const method = entry('new', '1');
		const node = saved('old', '1');
		expect(findSavedNode(method.node, method, [node], new Set(['old']))).toBeUndefined();
		expect(findEntryForSavedNode(node, [method], new Set(['new']))).toBeUndefined();
	});
	it('does not match a connector method to an operator of the same index', () => {
		const method = entry('new', '1');
		const node: SavedUiNode = { ...saved('loop', '1'), type: 'loop' };
		expect(findSavedNode(method.node, method, [node], new Set())).toBeUndefined();
		expect(findEntryForSavedNode(node, [method], new Set())).toBeUndefined();
	});
});
