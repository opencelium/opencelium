import {act, renderHook} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {usePasteClipboard} from './usePasteClipboard';
import {createWorkflowClipboard} from './workflowClipboard';
import type {WorkflowNodeModel} from '../types/workflow.types';
import type {Connector} from '@entities/connector/model/types';
const {confirm} = vi.hoisted(() => ({confirm: vi.fn()}));
vi.mock('@shared/ui/confirm/ConfirmDialogContext', () => ({useConfirm: () => confirm}));
vi.mock('@shared/i18n/hooks/useI18n', () => ({useI18n: () => ({t: (key: string) => key})}));
const connector = (id: number, invokerName = 'Demo') => ({connectorId: id, title: `Connector ${id}`, invokerName});
const method = (id: string, color: string, connectorId: number, body = {}): WorkflowNodeModel => ({
    id, type: 'connector', position: {x: 0, y: 0}, data: {title: id, kind: 'connector', color,
        connector: connector(connectorId), methodConfig: {url: '', headers: {}, queryParams: [], endpointArgs: {}, bodyFormat: 'json', bodyData: 'raw', body}},
});
const start: WorkflowNodeModel = {id: 'start-1', type: 'start', position: {x: 0, y: 0}, data: {title: 'Start', kind: 'start'}};
const target = method('target', '#112233', 22);
const nodes = [start, target];
const edges = [{id: 'e', source: start.id, target: target.id}];
const bindings: unknown[] = [];
const snapshot = (body = {}) => createWorkflowClipboard('A', ['source'], [method('source', '#445566', 11, body)], []);
const instanceConnector = (id: number) => ({connectorId: id, title: `Connector ${id}`,
    invoker: {name: 'Demo'}} as Connector);
function setup(disabled = false, targetNodes = nodes, instanceConnectors: Connector[] = []) {
    const apply = vi.fn();
    const hook = renderHook(() => usePasteClipboard({nodes: targetNodes, edges, fieldBindings: bindings,
        connectors: instanceConnectors, disabled, onApply: apply}));
    return {...hook, apply};
}
beforeEach(() => {confirm.mockReset(); confirm.mockResolvedValue(true);});
describe('cross-workflow paste decisions', () => {
    it('automatically maps a compatible connector without opening a dialog', async () => {
        const hook = setup();
        await act(() => hook.result.current.paste(snapshot(), target.id, 'right'));
        expect(confirm).not.toHaveBeenCalled();
        expect(hook.apply).toHaveBeenCalledOnce();
        expect(hook.apply.mock.calls[0][0].find((node: WorkflowNodeModel) => node.selected)?.data.connector?.connectorId).toBe(22);
    });
    it('does not modify the graph when an external-reference dialog is cancelled', async () => {
        confirm.mockResolvedValue(false);
        const hook = setup();
        await act(() => hook.result.current.paste(snapshot({id: '#112233.(response).body.$.id'}), target.id, 'right'));
        expect(confirm).toHaveBeenCalledOnce();
        expect(hook.apply).not.toHaveBeenCalled();
    });
    it('clears external references on confirmation without touching existing target nodes', async () => {
        const hook = setup();
        await act(() => hook.result.current.paste(snapshot({id: '#112233.(response).body.$.id'}), target.id, 'right'));
        const pasted = hook.apply.mock.calls[0][0] as WorkflowNodeModel[];
        expect(pasted.find((node) => node.id === target.id)?.data).toEqual(target.data);
        expect(JSON.stringify(pasted.find((node) => node.selected)?.data.methodConfig?.body)).not.toContain('.(response)');
    });
    it('remaps an external reference to the chosen target method', async () => {
        confirm.mockImplementation(async (options) => {
            const color = options.message.props.preview.targets[0].color;
            options.message.props.onRemap({colors: new Map([[color, target.data.color]]), references: new Map()});
            return true;
        });
        const hook = setup();
        await act(() => hook.result.current.paste(snapshot({id: '#abcdef.(response).body.$.id'}), target.id, 'right'));
        const pasted = hook.apply.mock.calls[0][0] as WorkflowNodeModel[];
        expect(pasted.find((node) => node.selected)?.data.methodConfig?.body)
            .toEqual({id: `${target.data.color}.(response).body.$.id`});
        expect(pasted.find((node) => node.id === target.id)?.data).toEqual(target.data);
    });
    it('applies the connector selected in the paste-check dialog', async () => {
        const second = {...method('second', '#778899', 33)};
        confirm.mockImplementation(async (options) => {
            options.message.props.onConnector('source', connector(33));
            return true;
        });
        const hook = setup(false, [...nodes, second]);
        await act(() => hook.result.current.paste(snapshot(), target.id, 'right'));
        expect(confirm).toHaveBeenCalledOnce();
        expect(hook.apply.mock.calls[0][0].find((node: WorkflowNodeModel) => node.selected)?.data.connector?.connectorId).toBe(33);
    });
    it('keeps the step’s own connector when the target uses none of that system', async () => {
        const hook = setup(false, [start], [instanceConnector(11)]);
        await act(() => hook.result.current.paste(snapshot(), start.id, 'right'));
        expect(confirm).not.toHaveBeenCalled();
        const pasted = (hook.apply.mock.calls[0][0] as WorkflowNodeModel[]).find((node) => node.selected);
        expect(pasted?.data.connector?.connectorId).toBe(11);
    });
    it('treats system steps like connector steps', async () => {
        const system = {...method('source', '#445566', 11), type: 'system' as const};
        system.data = {...system.data, kind: 'system'};
        const hook = setup(false, [start]);
        await act(() => hook.result.current.paste(createWorkflowClipboard('A', ['source'], [system], []), start.id, 'right'));
        expect(confirm.mock.calls[0][0]).toMatchObject({isConfirmHidden: true});
        expect(hook.apply).not.toHaveBeenCalled();
    });
    it('does not paste a step whose own connector was deleted and the target has no match', async () => {
        const hook = setup(false, [start]);
        await act(() => hook.result.current.paste(snapshot(), start.id, 'right'));
        expect(confirm).toHaveBeenCalledOnce();
        expect(confirm.mock.calls[0][0]).toMatchObject({isConfirmHidden: true, cancelText: 'actions.close'});
        expect(hook.apply).not.toHaveBeenCalled();
    });
    it('pastes only compatible steps when the user confirms paste the rest', async () => {
        const incompatible = method('unavailable', '#abcdef', 99);
        incompatible.data.connector = connector(99, 'Other system');
        const copied = createWorkflowClipboard('A', ['source', 'unavailable'],
            [method('source', '#445566', 11), incompatible], []);
        const hook = setup();
        await act(() => hook.result.current.paste(copied, target.id, 'right'));
        expect(confirm.mock.calls[0][0].confirmText).toBe('pasteCheck.pasteRest');
        const pasted = hook.apply.mock.calls[0][0] as WorkflowNodeModel[];
        expect(pasted.filter((node) => node.selected).map((node) => node.data.title)).toEqual(['source']);
    });
    it('does not apply a pending paste if the workflow becomes locked', async () => {
        let accept!: (accepted: boolean) => void;
        confirm.mockImplementation(() => new Promise<boolean>((resolve) => {accept = resolve;}));
        const apply = vi.fn();
        const hook = renderHook(({disabled}) => usePasteClipboard({nodes, edges, fieldBindings: bindings,
            connectors: [], disabled, onApply: apply}), {initialProps: {disabled: false}});
        let pending!: Promise<boolean>;
        act(() => {pending = hook.result.current.paste(snapshot({id: '#abcdef.(response).body.$.id'}), target.id, 'right');});
        hook.rerender({disabled: true});
        await act(async () => {accept(true); await pending;});
        expect(apply).not.toHaveBeenCalled();
    });
    it('blocks paste while locked', async () => {
        const hook = setup(true);
        await act(() => hook.result.current.paste(snapshot(), target.id, 'right'));
        expect(confirm).not.toHaveBeenCalled();
        expect(hook.apply).not.toHaveBeenCalled();
    });
});
