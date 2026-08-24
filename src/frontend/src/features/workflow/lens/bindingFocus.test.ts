import { describe, expect, it } from 'vitest';
import type { LensBinding, LensBindingGraph, LensBindingSource } from './bindingLens.types';
import { buildNodeBindingSummaries, resolveFocusRelatedNodeIds } from './bindingFocus';

const endpoint = (nodeId: string | null, path: string) => ({
	nodeId, label: nodeId, color: '#3fa9f5', direction: 'response' as const,
	messageProperty: 'body', field: path, path: `body.$.${path}`,
});

const enhancement = (enhanceId: string, varKey = 'VAR_0'): LensBindingSource =>
	({ kind: 'enhancement', enhanceId, varKey });

const lensBinding = (overrides: Partial<LensBinding> = {}): LensBinding => ({
	key: 'en-1:VAR_0',
	source: { kind: 'enhancement', enhanceId: 'en-1', varKey: 'VAR_0' },
	consumer: { ...endpoint('m2', 'userId'), direction: 'request' },
	provider: endpoint('m1', 'id'),
	isScript: false,
	invalidReason: null,
	unreadableProviderNodeId: null,
	...overrides,
});

const graph = (bindings: LensBinding[]): LensBindingGraph =>
	({ bindings, skipped: { malformed: 0, outsideScope: 0, unanchored: 0 } });

describe('buildNodeBindingSummaries', () => {
	it('counts a binding on both of its methods', () => {
		const summaries = buildNodeBindingSummaries(graph([lensBinding()]));
		expect(summaries.get('m1')).toEqual({ receives: 0, provides: 1, broken: 0 });
		expect(summaries.get('m2')).toEqual({ receives: 1, provides: 0, broken: 0 });
	});

	it('counts a field once however many references fill it', () => {
		// A script pulling two responses into one target field: one received field,
		// which is what the consumer's card will show one row for.
		const summaries = buildNodeBindingSummaries(graph([
			lensBinding({ isScript: true }),
			lensBinding({ key: 'en-1:VAR_1', source: enhancement('en-1', 'VAR_1'), isScript: true,
				provider: endpoint('m3', 'other') }),
		]));
		expect(summaries.get('m2')).toEqual({ receives: 1, provides: 0, broken: 0 });
		expect(summaries.get('m1')?.provides).toBe(1);
		expect(summaries.get('m3')?.provides).toBe(1);
	});

	it('counts a broken reference as a break rather than as something provided', () => {
		const summaries = buildNodeBindingSummaries(graph([
			lensBinding({ provider: endpoint(null, 'id'), invalidReason: 'out-of-scope',
				unreadableProviderNodeId: 'm1' }),
		]));
		expect(summaries.get('m1')).toEqual({ receives: 0, provides: 0, broken: 1 });
		expect(summaries.get('m2')).toEqual({ receives: 1, provides: 0, broken: 1 });
	});

	it('badges a method whose reference names no method at all', () => {
		const summaries = buildNodeBindingSummaries(graph([
			lensBinding({ provider: endpoint(null, 'id'), invalidReason: 'missing-method' }),
		]));
		// The only place this binding is visible: no arc can be drawn for it.
		expect(summaries.get('m2')).toEqual({ receives: 1, provides: 0, broken: 1 });
		expect([...summaries.keys()]).toEqual(['m2']);
	});
});

describe('resolveFocusRelatedNodeIds', () => {
	it('collects the methods at the other end, excluding the focused one', () => {
		const related = resolveFocusRelatedNodeIds(graph([
			lensBinding(),
			lensBinding({ key: 'en-2:VAR_0', source: enhancement('en-2'), provider: endpoint('m3', 'x') }),
			lensBinding({ key: 'en-3:VAR_0', source: enhancement('en-3'),
				consumer: { ...endpoint('m4', 'y'), direction: 'request' },
				provider: endpoint('m3', 'x') }),
		]), 'm2');
		expect([...related].sort()).toEqual(['m1', 'm3']);
	});

	it('is empty without a focus', () => {
		expect(resolveFocusRelatedNodeIds(graph([lensBinding()]), null).size).toBe(0);
	});
});
