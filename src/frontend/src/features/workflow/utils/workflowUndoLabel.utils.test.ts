import { describe, expect, it } from 'vitest';
import type { WorkflowUndoChange } from '../types/undoHistory.types';
import { isUndoChangeDeletion } from './workflowUndoLabel.utils';

const deletions: WorkflowUndoChange[] = [
	{ kind: 'nodes-removed', count: 1, name: 'AddUser' },
	{ kind: 'method-reference', section: 'body', operation: 'removed' },
	{ kind: 'method-enhancement', section: 'body', aspect: 'removed' },
	{ kind: 'aggregator-config', operation: 'removed' },
	{ kind: 'condition-rule', operator: 'if', operation: 'removed' },
	{ kind: 'condition-group', operator: 'loop', operation: 'removed' },
];

const nonDeletions: WorkflowUndoChange[] = [
	{ kind: 'initial' },
	{ kind: 'nodes-added', count: 1, name: 'AddUser' },
	{ kind: 'nodes-moved', count: 2 },
	{ kind: 'method-reference', section: 'body', operation: 'added' },
	{ kind: 'method-enhancement', section: 'header', aspect: 'script' },
	{ kind: 'aggregator-config', operation: 'configured' },
	{ kind: 'condition-rule', operator: 'if', operation: 'edited' },
	{ kind: 'condition-group', operator: 'loop', operation: 'added' },
	{ kind: 'edges-changed' },
	{ kind: 'multiple' },
];

describe('isUndoChangeDeletion', () => {
	it.each(deletions)('marks $kind as a deletion', (change) => {
		expect(isUndoChangeDeletion(change)).toBe(true);
	});

	it.each(nonDeletions)('leaves $kind unmarked', (change) => {
		expect(isUndoChangeDeletion(change)).toBe(false);
	});
});
