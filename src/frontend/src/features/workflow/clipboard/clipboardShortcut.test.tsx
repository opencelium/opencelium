import {cleanup, fireEvent, renderHook} from '@testing-library/react';
import {afterEach, expect, it, vi} from 'vitest';
import {usePasteCopiedNodeShortcut} from '../hooks/usePasteCopiedNodeShortcut';
import type {WorkflowNodeModel} from '../types/workflow.types';

afterEach(cleanup);
const target: WorkflowNodeModel = {id: 'target', type: 'system', selected: true,
    position: {x: 0, y: 0}, data: {title: 'Target', kind: 'system'}};
const setup = (disabled = false, node: WorkflowNodeModel = target) => {
    const onPasteNodes = vi.fn();
    const onChooseOperatorPlacement = vi.fn();
    renderHook(() => usePasteCopiedNodeShortcut({disabled, copiedNodeIds: ['from-another-workflow'],
        nodes: [node], onPasteNodes, onChooseOperatorPlacement}));
    return {onPasteNodes, onChooseOperatorPlacement};
};
it('pastes copied IDs absent from the target graph', () => {
    const {onPasteNodes} = setup();
    fireEvent.keyDown(window, {key: 'v', ctrlKey: true});
    expect(onPasteNodes).toHaveBeenCalledWith(['from-another-workflow'], 'target');
});
it.each(['if', 'loop'] as const)('keeps the placement dialog for %s targets', (type) => {
    const {onPasteNodes, onChooseOperatorPlacement} = setup(false, {...target, type});
    fireEvent.keyDown(window, {key: 'v', metaKey: true});
    expect(onChooseOperatorPlacement).toHaveBeenCalledWith(['from-another-workflow'], 'target');
    expect(onPasteNodes).not.toHaveBeenCalled();
});
it('does not paste while locked or while typing in a field', () => {
    const locked = setup(true);
    fireEvent.keyDown(window, {key: 'v', ctrlKey: true});
    expect(locked.onPasteNodes).not.toHaveBeenCalled();
    cleanup();
    const unlocked = setup();
    const input = document.createElement('input');
    document.body.append(input);
    fireEvent.keyDown(input, {key: 'v', ctrlKey: true});
    expect(unlocked.onPasteNodes).not.toHaveBeenCalled();
    input.remove();
});
