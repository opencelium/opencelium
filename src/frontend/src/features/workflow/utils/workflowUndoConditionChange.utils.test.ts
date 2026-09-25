import { describe, expect, it } from 'vitest';
import type { ConditionChild, ConditionConfig } from '../components/condition-builder/conditionBuilder.types';
import { describeConditionChange } from './workflowUndoConditionChange.utils';
import { undoChangeLabel } from './workflowUndoLabel.utils';

const rule = (id: string, leftField = 'a'): ConditionChild =>
	({ id, type: 'rule', properties: { leftField, operator: '=', rightField: 'b' } });

const group = (id: string, items: ConditionChild[] = []): ConditionChild =>
	({ id, type: 'group', properties: { conjunction: '&&' }, items });

const config = (items: ConditionChild[], overrides: Partial<ConditionConfig> = {}): ConditionConfig => ({
	operatorType: 'if',
	tree: { id: 'root', type: 'group', properties: { conjunction: '&&' }, items },
	expression: '',
	...overrides,
});

describe('describeConditionChange', () => {
	it('reports a rule added, edited and deleted', () => {
		expect(describeConditionChange(config([]), config([rule('r1')]), 'if'))
			.toMatchObject({ kind: 'condition-rule', operator: 'if', operation: 'added' });
		expect(describeConditionChange(config([rule('r1', 'a')]), config([rule('r1', 'z')]), 'if'))
			.toMatchObject({ kind: 'condition-rule', operator: 'if', operation: 'edited' });
		expect(describeConditionChange(config([rule('r1')]), config([]), 'if'))
			.toMatchObject({ kind: 'condition-rule', operator: 'if', operation: 'removed' });
	});

	it('names the LOOP operator when the edit belongs to one', () => {
		expect(describeConditionChange(config([]), config([rule('r1')]), 'loop'))
			.toMatchObject({ kind: 'condition-rule', operator: 'loop', operation: 'added' });
	});

	it('does not mistake the first rule of an empty condition for a new group', () => {
		// The root group always exists, so it must never be counted.
		expect(describeConditionChange(config([]), config([rule('r1')]), 'if').kind)
			.toBe('condition-rule');
	});

	it('reports a group added, edited and deleted', () => {
		expect(describeConditionChange(config([]), config([group('g1')]), 'if'))
			.toMatchObject({ kind: 'condition-group', operator: 'if', operation: 'added' });
		expect(describeConditionChange(
			config([group('g1')]),
			config([{ id: 'g1', type: 'group', properties: { conjunction: '||' }, items: [] }]),
			'if',
		)).toMatchObject({ kind: 'condition-group', operator: 'if', operation: 'edited' });
		expect(describeConditionChange(config([group('g1')]), config([]), 'if'))
			.toMatchObject({ kind: 'condition-group', operator: 'if', operation: 'removed' });
	});

	it('reports the group when adding one seeds it with a rule', () => {
		expect(describeConditionChange(config([]), config([group('g1', [rule('r1')])]), 'if'))
			.toMatchObject({ kind: 'condition-group', operator: 'if', operation: 'added' });
	});

	it('reports the group when deleting one takes its rules with it', () => {
		expect(describeConditionChange(config([group('g1', [rule('r1')])]), config([]), 'if'))
			.toMatchObject({ kind: 'condition-group', operator: 'if', operation: 'removed' });
	});

	it('finds rules nested inside groups', () => {
		expect(describeConditionChange(
			config([group('g1', [rule('r1', 'a')])]),
			config([group('g1', [rule('r1', 'z')])]),
			'if',
		)).toMatchObject({ kind: 'condition-rule', operator: 'if', operation: 'edited' });
	});

	it('reports a top-level conjunction or NOT change as a condition edit', () => {
		const withRoot = (properties: Record<string, unknown>): ConditionConfig => ({
			operatorType: 'if', expression: '',
			tree: { id: 'root', type: 'group', properties, items: [rule('r1')] },
		});

		expect(describeConditionChange(
			withRoot({ conjunction: '&&' }), withRoot({ conjunction: '||' }), 'if',
		)).toMatchObject({ kind: 'condition-rule', operator: 'if', operation: 'edited' });

		expect(describeConditionChange(
			withRoot({ conjunction: '&&' }), withRoot({ conjunction: '&&', not: true }), 'if',
		)).toMatchObject({ kind: 'condition-rule', operator: 'if', operation: 'edited' });
	});

	it('does not let an initialised root conjunction hide the first rule added', () => {
		const empty: ConditionConfig = { operatorType: 'if', expression: '',
			tree: { id: 'root', type: 'group', items: [] } };
		const seeded: ConditionConfig = { operatorType: 'if', expression: '',
			tree: { id: 'root', type: 'group', properties: { conjunction: '&&' }, items: [rule('r1')] } };
		expect(describeConditionChange(empty, seeded, 'if'))
			.toMatchObject({ kind: 'condition-rule', operator: 'if', operation: 'added' });
	});

	it('names the operator when several independent things changed', () => {
		// A rule edited AND a group's conjunction flipped: two actions, so neither
		// one gets to speak for the entry.
		expect(describeConditionChange(
			config([rule('r1', 'a'), group('g1', [rule('r2')])]),
			config([rule('r1', 'z'),
				{ id: 'g1', type: 'group', properties: { conjunction: '||' }, items: [rule('r2')] }]),
			'if',
		)).toMatchObject({ kind: 'operator-edited', operator: 'if' });

		// A rule added AND the loop iterator changed.
		expect(describeConditionChange(
			config([], { iterator: '$i' }),
			config([rule('r1')], { iterator: '$j' }),
			'loop',
		)).toMatchObject({ kind: 'operator-edited', operator: 'loop' });
	});

	it('still reports one group action when its own rules came with it', () => {
		// The rule arrived inside the new group, so this stays a single action —
		// the rule delta is explained by the group delta, not independent of it.
		expect(describeConditionChange(config([]), config([group('g1', [rule('r1')])]), 'if'))
			.toMatchObject({ kind: 'condition-group', operator: 'if', operation: 'added' });
		expect(describeConditionChange(config([group('g1', [rule('r1')])]), config([]), 'if'))
			.toMatchObject({ kind: 'condition-group', operator: 'if', operation: 'removed' });
	});

	it('names the operator when a group is added and an unrelated rule is edited', () => {
		expect(describeConditionChange(
			config([rule('r1', 'a')]),
			config([rule('r1', 'z'), group('g1', [rule('r2')])]),
			'if',
		)).toMatchObject({ kind: 'operator-edited', operator: 'if' });
	});

	it('falls back to the generic label for an iterator-only change', () => {
		expect(describeConditionChange(
			config([rule('r1')], { iterator: '$i' }),
			config([rule('r1')], { iterator: '$j' }),
			'loop',
			'Loop',
		)).toMatchObject({ kind: 'condition-config', name: 'Loop' });
	});
});

describe('undoChangeLabel for condition kinds', () => {
	it('exposes the operator as a key the caller resolves', () => {
		expect(undoChangeLabel({ kind: 'condition-rule', operator: 'if', operation: 'added' }))
			.toEqual({
				key: 'undoHistory.change.conditionAdded',
				valueKeys: { operator: 'undoHistory.operator.if' },
			});
		expect(undoChangeLabel({ kind: 'condition-group', operator: 'loop', operation: 'removed' }))
			.toEqual({
				key: 'undoHistory.change.groupRemoved',
				valueKeys: { operator: 'undoHistory.operator.loop' },
			});
		expect(undoChangeLabel({ kind: 'operator-edited', operator: 'loop' }))
			.toEqual({
				key: 'undoHistory.change.operatorEdited',
				valueKeys: { operator: 'undoHistory.operator.loop' },
			});
	});

	it('maps a relabel to the new label and an aggregator to its subject', () => {
		expect(undoChangeLabel({ kind: 'node-renamed', label: 'FetchUsers' }))
			.toEqual({ key: 'undoHistory.change.changedLabel', values: { label: 'FetchUsers' } });
		expect(undoChangeLabel({ kind: 'aggregator-config', operation: 'configured', name: 'GetAllUser' }))
			.toEqual({ key: 'undoHistory.change.aggregatorConfigured', values: { name: 'GetAllUser' } });
		expect(undoChangeLabel({ kind: 'aggregator-config', operation: 'removed', name: 'GetAllUser' }))
			.toEqual({ key: 'undoHistory.change.aggregatorRemoved', values: { name: 'GetAllUser' } });
		expect(undoChangeLabel({ kind: 'aggregator-config', operation: 'removed',
			nameKey: 'undoHistory.nodeKind.loop' }))
			.toEqual({ key: 'undoHistory.change.aggregatorRemoved',
				valueKeys: { name: 'undoHistory.nodeKind.loop' } });
	});

	it('maps each enhancement aspect to its own sentence', () => {
		const at = (aspect: 'script' | 'language' | 'description' | 'removed' | 'multiple') =>
			undoChangeLabel({ kind: 'method-enhancement', section: 'body', aspect, name: 'X' });
		expect(at('script')).toEqual({ key: 'undoHistory.change.enhancement',
			values: { name: 'X' }, valueKeys: { section: 'undoHistory.section.body' } });
		expect(at('language')).toEqual({ key: 'undoHistory.change.enhancementLanguage',
			values: { name: 'X' } });
		expect(at('description')).toEqual({ key: 'undoHistory.change.enhancementDescription',
			values: { name: 'X' } });
		expect(at('removed')).toEqual({ key: 'undoHistory.change.enhancementRemoved',
			values: { name: 'X' } });
		// A multi-aspect session shares the generic sentence with a script change.
		expect(at('multiple')).toEqual({ key: 'undoHistory.change.enhancement',
			values: { name: 'X' }, valueKeys: { section: 'undoHistory.section.body' } });
	});

	it('names a node by kind when the change carries a nameKey', () => {
		expect(undoChangeLabel({ kind: 'nodes-added', count: 1, nameKey: 'undoHistory.nodeKind.webhook' }))
			.toEqual({
				key: 'undoHistory.change.nodeAdded',
				valueKeys: { name: 'undoHistory.nodeKind.webhook' },
			});
	});
});
