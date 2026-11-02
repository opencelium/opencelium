import { describe, expect, it } from 'vitest';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { insertionPoint, lastMainStepId } from './insertionPoint';

const node = (id: string, type: string) => ({ id, type, position: { x: 0, y: 0 }, data: { title: id, kind: type } }) as unknown as WorkflowNodeModel;
const edge = (source: string, target: string, sourceHandle?: string) =>
	({ id: `${source}-${target}`, source, target, sourceHandle, type: 'workflow-edge' }) as WorkflowEdgeModel;

// start → A → loop ⤵ B (inside) ; loop → C ; a note on the side.
const nodes = [node('start-1', 'start'), node('a', 'connector'), node('loop', 'loop'), node('b', 'connector'), node('c', 'connector'), node('note', 'comment')];
const edges = [edge('start-1', 'a'), edge('a', 'loop'), edge('loop', 'b', 'bottom'), edge('loop', 'c', 'right')];

describe('insertionPoint', () => {
	it('adds after a method from its right side', () => {
		expect(insertionPoint(nodes, edges, 'a', 'after')).toEqual({ sourceNodeId: 'a', sourceHandle: undefined, direction: 'right' });
	});

	it('adds after an operator past its scope, not into it', () => {
		expect(insertionPoint(nodes, edges, 'loop', 'after')).toEqual({ sourceNodeId: 'loop', sourceHandle: 'right', direction: 'right' });
	});

	it('adds before a step from the step before it', () => {
		expect(insertionPoint(nodes, edges, 'loop', 'before')).toEqual({ sourceNodeId: 'a', sourceHandle: undefined, direction: 'right' });
	});

	it('adds before the first step of a loop as its new first step', () => {
		expect(insertionPoint(nodes, edges, 'b', 'before')).toEqual({ sourceNodeId: 'loop', sourceHandle: 'bottom', direction: 'bottom' });
	});

	it('adds before the first step of the workflow from the start', () => {
		expect(insertionPoint(nodes, edges, 'a', 'before')).toMatchObject({ sourceNodeId: 'start-1', direction: 'right' });
	});

	it('has no place next to a note, or before the start', () => {
		expect(insertionPoint(nodes, edges, 'note', 'after')).toBeNull();
		expect(insertionPoint(nodes, edges, 'start-1', 'before')).toBeNull();
	});
});

describe('lastMainStepId', () => {
	it('follows the top-level chain past operators, not into them', () => {
		expect(lastMainStepId(nodes, edges)).toBe('c');
	});

	it('is the start node in an empty workflow', () => {
		expect(lastMainStepId([node('start-1', 'start')], [])).toBe('start-1');
	});
});
