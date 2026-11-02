import {describe, expect, it} from 'vitest';
import {createWorkflowClipboard, parseWorkflowClipboard} from './workflowClipboard';
import {prepareClipboardPaste} from './clipboardGraph';
import type {WorkflowNodeModel, WorkflowEdgeModel} from '../types/workflow.types';
import {ALL_COLORS} from '../constants/colors';
const node = (id: string, color: string, body = {}): WorkflowNodeModel => ({
    id, type: 'system', position: {x: 0, y: 0}, data: {title: id, kind: 'system', color,
        methodConfig: {url: '', headers: {}, queryParams: [], endpointArgs: {}, bodyFormat: 'json', bodyData: 'raw', body}},
});
const start: WorkflowNodeModel = {id: 'start-1', type: 'start', position: {x: 0, y: 0}, data: {title: 'Start', kind: 'start'}};
const edge = (source: string, target: string, sourceHandle?: string): WorkflowEdgeModel =>
    ({id: `${source}-${target}`, source, target, sourceHandle, type: 'workflow-edge'});
const a = node('a', '#112233');
const b = node('b', '#445566', {id: '#112233.(response).body.$.id'});
const graph = {nodes: [start, a, b], edges: [edge('start-1', 'a'), edge('a', 'b')]};
const paste = (ids: string[]) => prepareClipboardPaste(createWorkflowClipboard('A', ids, graph.nodes, graph.edges),
    [start], [], [], {nodeId: 'start-1', direction: 'right'}, new Map(), new Set());
describe('portable workflow copy', () => {
    it('stores content, not just IDs, and rejects obsolete or malformed snapshots', () => {
        const snapshot = createWorkflowClipboard('A', ['a'], graph.nodes, graph.edges);
        expect(parseWorkflowClipboard(JSON.stringify(snapshot))?.nodes[0].data.title).toBe('a');
        expect(parseWorkflowClipboard(JSON.stringify({...snapshot, version: 2}))).toBeNull();
        expect(parseWorkflowClipboard('invalid')).toBeNull();
        expect(snapshot.nodes.map((item) => item.id)).toEqual(['a']);
    });
    it('rewrites internal references and generates new IDs and colors', () => {
        const result = paste(['a', 'b']);
        const clonedA = result.nodes.find((item) => item.id === result.idMap.get('a'))!;
        const clonedB = result.nodes.find((item) => item.id === result.idMap.get('b'))!;
        expect(clonedA.id).not.toBe('a');
        expect(clonedB.data.methodConfig?.body).toEqual({id: `${clonedA.data.color}.(response).body.$.id`});
        expect(result.invalidReferences).toEqual([]);
        expect(result.targets).toEqual([]);
    });
    it('keeps distinct internal references when source colors overlap the target palette', () => {
        const first = node('first', ALL_COLORS[1]);
        const second = node('second', ALL_COLORS[0]);
        const consumer = node('consumer', ALL_COLORS[2], {
            combined: `${first.data.color}.(response).body.$.id/${second.data.color}.(response).body.$.id`,
        });
        const snapshot = createWorkflowClipboard('A', ['first', 'second', 'consumer'],
            [start, first, second, consumer], [edge(start.id, first.id), edge(first.id, second.id), edge(second.id, consumer.id)]);
        const result = prepareClipboardPaste(snapshot, [start], [], [], {nodeId: start.id, direction: 'right'}, new Map(), new Set());
        const pasted = (id: string) => result.nodes.find((item) => item.id === result.idMap.get(id))!;
        expect(pasted('consumer').data.methodConfig?.body).toEqual({
            combined: `${pasted('first').data.color}.(response).body.$.id/${pasted('second').data.color}.(response).body.$.id`,
        });
    });
    it('rewrites references to copied workflow-trigger methods', () => {
        const trigger: WorkflowNodeModel = {...a, type: 'trigger-connection',
            data: {...a.data, kind: 'trigger-connection'}};
        const snapshot = createWorkflowClipboard('A', ['a', 'b'], [start, trigger, b], graph.edges);
        const result = prepareClipboardPaste(snapshot, [start], [], [], {nodeId: start.id, direction: 'right'}, new Map(), new Set());
        const clonedTrigger = result.nodes.find((item) => item.id === result.idMap.get('a'))!;
        const clonedConsumer = result.nodes.find((item) => item.id === result.idMap.get('b'))!;
        expect(clonedTrigger.data.color).not.toBe(trigger.data.color);
        expect(clonedConsumer.data.methodConfig?.body).toEqual({id: `${clonedTrigger.data.color}.(response).body.$.id`});
        expect(result.invalidReferences).toEqual([]);
    });
    it('isolates external references and offers remapping instead of binding by coincident color', () => {
        const snapshot = createWorkflowClipboard('A', ['b'], graph.nodes, graph.edges);
        const result = prepareClipboardPaste(snapshot, [start, a], [edge('start-1', 'a')], [],
            {nodeId: 'a', direction: 'right'}, new Map(), new Set());
        expect(result.targets).toHaveLength(1);
        expect(result.targets[0].color).not.toBe('#112233');
        expect(result.targets[0].candidates.map((item) => item.nodeId)).toContain('a');
    });
    it('names outside steps by their source title, not by their reference color', () => {
        const source = {...a, data: {...a.data, title: 'Fetch customer'}};
        const snapshot = createWorkflowClipboard('A', ['b'], [start, source, b], graph.edges);
        expect(snapshot.externalTitles).toEqual({'#112233': 'Fetch customer'});
        const result = prepareClipboardPaste(snapshot, [start], [], [],
            {nodeId: 'start-1', direction: 'right'}, new Map(), new Set());
        expect(result.targets[0].label).toBe('Fetch customer');
    });
    it('accepts copies without stored titles and rejects malformed ones', () => {
        const snapshot = createWorkflowClipboard('A', ['b'], graph.nodes, graph.edges);
        const withoutTitles: Partial<typeof snapshot> = {...snapshot};
        delete withoutTitles.externalTitles;
        expect(parseWorkflowClipboard(JSON.stringify(withoutTitles))).not.toBeNull();
        expect(parseWorkflowClipboard(JSON.stringify({...snapshot, externalTitles: {x: 1}}))).toBeNull();
    });
    it('preserves same-workflow references even after the copied original was deleted', () => {
        const snapshot = createWorkflowClipboard('A', ['b'], graph.nodes, graph.edges);
        const result = prepareClipboardPaste(snapshot, [start, a], [edge(start.id, a.id)], [],
            {nodeId: a.id, direction: 'right'}, new Map(), new Set(), false);
        expect(result.nodes.find((item) => item.id === result.idMap.get('b'))?.data.methodConfig?.body)
            .toEqual(b.data.methodConfig?.body);
        expect(result.invalidReferences).toEqual([]);
        expect(result.targets).toEqual([]);
    });
    it('retains the existing iterator-scope check when pasting outside a loop', () => {
        const loop: WorkflowNodeModel = {id: 'loop', type: 'loop', position: {x: 0, y: 0},
            data: {title: 'Loop', kind: 'loop', conditionConfig: {operatorType: 'loop', iterator: 'i',
                expression: '', tree: {id: 'root', type: 'group', items: []}}}};
        const consumer = node('consumer', '#778899', {id: '#112233.(response).body.$.[i].id'});
        const nodes = [start, a, loop, consumer];
        const edges = [edge(start.id, a.id), edge(a.id, loop.id), edge(loop.id, consumer.id, 'bottom')];
        const snapshot = createWorkflowClipboard('A', [consumer.id], nodes, edges);
        const result = prepareClipboardPaste(snapshot, nodes, edges, [],
            {nodeId: loop.id, direction: 'right'}, new Map(), new Set(), false);
        expect(result.invalidReferences).toEqual([
            {consumerNodeId: result.idMap.get(consumer.id), sourceColor: '#112233', iterator: 'i'},
        ]);
    });
    it('copies nested steps and their anchored comments', () => {
        const operator: WorkflowNodeModel = {id: 'if', type: 'if', position: {x: 0, y: 0}, data: {title: 'IF', kind: 'if'}};
        const comment: WorkflowNodeModel = {id: 'note', type: 'comment', position: {x: 0, y: 0},
            data: {title: '', kind: 'comment', comment: {text: 'Keep me', anchorNodeId: 'a', offset: {x: 5, y: 6}}}};
        const snapshot = createWorkflowClipboard('A', ['if'], [start, operator, a, b, comment],
            [edge('start-1', 'if'), edge('if', 'a', 'true'), edge('a', 'b')]);
        const result = prepareClipboardPaste(snapshot, [start], [], [], {nodeId: 'start-1', direction: 'right'}, new Map(), new Set());
        expect(result.nodes.filter((item) => result.insertedIds.has(item.id))).toHaveLength(4);
        expect(result.nodes.find((item) => item.type === 'comment')?.data.comment?.anchorNodeId).toBe(result.idMap.get('a'));
        expect(result.invalidReferences).toEqual([]);
    });
    it('copies enhancement bindings and remaps their providers and consumers', () => {
        const binding = {from: [{color: '#112233', type: 'response', field: 'body.$.id'}],
            to: [{color: '#445566', type: 'request', field: 'body.$.id'}],
            enhancement: {language: 'js', script: 'RESULT_VAR = VAR_0', args: {
                VAR_0: '#112233.(response).body.$.id', RESULT_VAR: '#445566.(request).body.$.id',
            }}};
        const snapshot = createWorkflowClipboard('A', ['a', 'b'], graph.nodes, graph.edges, [binding]);
        const result = prepareClipboardPaste(snapshot, [start], [], [], {nodeId: start.id, direction: 'right'}, new Map(), new Set());
        const newA = result.nodes.find((item) => item.id === result.idMap.get('a'))!;
        const newB = result.nodes.find((item) => item.id === result.idMap.get('b'))!;
        expect(result.fieldBindings).toHaveLength(1);
        expect(JSON.stringify(result.fieldBindings)).toContain(newA.data.color);
        expect(JSON.stringify(result.fieldBindings)).toContain(newB.data.color);
        expect(JSON.stringify(result.fieldBindings)).not.toContain('#112233');
        expect(JSON.stringify(result.fieldBindings)).not.toContain('#445566');
    });
    it('keeps distinct provider references in an enhancement expert expression', () => {
        const first = node('first', ALL_COLORS[1]);
        const second = node('second', ALL_COLORS[0]);
        const consumer = node('consumer', ALL_COLORS[2]);
        const reference = (method: WorkflowNodeModel) => `${method.data.color}.(response).body.$.id`;
        const binding = {from: [first, second].map((method) => ({color: method.data.color})),
            to: [{color: consumer.data.color}], enhancement: {language: 'js', args: {
                VAR_0: reference(first), VAR_1: reference(second),
                RESULT_VAR: `${consumer.data.color}.(request).body.$.id`,
            }, expertVar: `${reference(first)} + ${reference(second)}`}};
        const snapshot = createWorkflowClipboard('A', ['first', 'second', 'consumer'],
            [start, first, second, consumer], [edge(start.id, first.id), edge(first.id, second.id), edge(second.id, consumer.id)], [binding]);
        const result = prepareClipboardPaste(snapshot, [start], [], [], {nodeId: start.id, direction: 'right'}, new Map(), new Set());
        const copiedBinding = result.fieldBindings[0] as typeof binding;
        expect(copiedBinding.enhancement.expertVar.toLowerCase())
            .toBe(`${copiedBinding.enhancement.args.VAR_0} + ${copiedBinding.enhancement.args.VAR_1}`.toLowerCase());
    });
    it('omits blocked methods while keeping the remaining chain', () => {
        const snapshot = createWorkflowClipboard('A', ['a', 'b'], graph.nodes, graph.edges);
        const result = prepareClipboardPaste(snapshot, [start], [], [], {nodeId: 'start-1', direction: 'right'}, new Map(), new Set(['a']));
        expect(result.idMap.has('a')).toBe(false);
        expect(result.idMap.has('b')).toBe(true);
        expect(result.targets).toHaveLength(1);
    });
});
