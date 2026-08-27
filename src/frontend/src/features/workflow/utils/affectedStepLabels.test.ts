import { describe, expect, it } from 'vitest';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { describeAffectedSteps } from './affectedStepLabels';

const node = (id: string, title?: string, subtitle?: string) => ({
	id, type: 'connector', position: { x: 0, y: 0 },
	data: { title, subtitle },
} as unknown as WorkflowNodeModel);

const nodes = [
	node('m1', 'Connector', 'Get users'),
	node('m2', 'Create ticket'),
	node('m3', 'Notify'),
	node('m4', 'Archive'),
	node('m5', 'Report'),
];

describe('describeAffectedSteps', () => {
	// The method name is the subtitle where there is one — the title is the
	// connector above it, which every step of that connector shares.
	it('names steps the way the canvas does', () => {
		expect(describeAffectedSteps(nodes, ['m1', 'm2']).names)
			.toEqual(['Get users', 'Create ticket']);
	});

	it('caps the list and reports what it left out', () => {
		expect(describeAffectedSteps(nodes, ['m1', 'm2', 'm3', 'm4', 'm5']))
			.toEqual({ names: ['Get users', 'Create ticket', 'Notify'], more: 2 });
	});

	// The ids come from a pass over the graph as it will be *after* the change,
	// so a step that went away with it has no node left to name.
	it('drops ids with no node behind them', () => {
		expect(describeAffectedSteps(nodes, ['m1', 'gone']))
			.toEqual({ names: ['Get users'], more: 0 });
	});

	it('falls back to the id when a step has no name at all', () => {
		expect(describeAffectedSteps([node('m9')], ['m9']).names).toEqual(['m9']);
	});
});
