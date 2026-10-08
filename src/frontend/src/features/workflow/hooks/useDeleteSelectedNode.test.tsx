import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { useDeleteSelectedNode } from './useDeleteSelectedNode';

const node = (id: string, type: string, selected: boolean) =>
	({ id, type, selected, position: { x: 0, y: 0 }, data: { kind: type } }) as unknown as WorkflowNodeModel;

const nodes = [node('start-1', 'start', true), node('a', 'connector', true),
	node('b', 'connector', false), node('c', 'if', true)];

const press = (key: string, target: EventTarget = document.body) =>
	target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

describe('useDeleteSelectedNode', () => {
	afterEach(() => { document.body.innerHTML = ''; });

	const setup = (overrides: Partial<Parameters<typeof useDeleteSelectedNode>[0]> = {}) => {
		const onDeleteNodes = vi.fn();
		renderHook(() => useDeleteSelectedNode({ readOnly: false, disabled: false, nodes,
			onDeleteNodes, ...overrides }));
		return onDeleteNodes;
	};

	it.each(['Delete', 'Backspace'])('deletes every selected node except start on %s', (key) => {
		const onDeleteNodes = setup();
		press(key);
		expect(onDeleteNodes).toHaveBeenCalledWith(['a', 'c']);
	});

	it('leaves the key to a focused text field', () => {
		const onDeleteNodes = setup();
		const input = document.body.appendChild(document.createElement('input'));
		press('Backspace', input);
		expect(onDeleteNodes).not.toHaveBeenCalled();
	});

	it('does nothing while the editor is locked', () => {
		const onDeleteNodes = setup({ readOnly: true });
		press('Delete');
		expect(onDeleteNodes).not.toHaveBeenCalled();
	});
});
