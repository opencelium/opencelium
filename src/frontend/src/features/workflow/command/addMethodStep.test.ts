import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Connector } from '@entities/connector/model/types';
import type { WorkflowAction, WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { addMethodStep } from './addMethodStep';
import { workflowCommandBridgeStore } from './workflowCommandBridge';

vi.mock('@entities/connector/model/iconUrl', () => ({ resolveConnectorIcon: () => null }));

const node = (id: string, type: string, selected = false) =>
	({ id, type, selected, position: { x: 0, y: 0 }, data: { title: id, kind: type } }) as unknown as WorkflowNodeModel;
const edge = (source: string, target: string) => ({ id: `${source}-${target}`, source, target, type: 'workflow-edge' }) as WorkflowEdgeModel;
const operation = (name: string, type = 'GET') => ({ name, type, request: {}, response: {} });
const crm = { connectorId: 7, title: 'CRM', invoker: { name: 'CRM', operations: [operation('getAllUsers'), operation('test', 'test')] } } as unknown as Connector;

let nodes: WorkflowNodeModel[];
const addStep = vi.fn<(action: WorkflowAction) => string | null>(() => 'new-1');
const selectNode = vi.fn();

describe('addMethodStep', () => {
	beforeEach(() => {
		nodes = [node('start-1', 'start'), node('a', 'connector'), node('b', 'connector')];
		workflowCommandBridgeStore.setState({
			isActive: true, isEditable: () => true, getConnectors: () => [crm],
			getNodes: () => nodes, getEdges: () => [edge('start-1', 'a'), edge('a', 'b')], addStep, centerOnNode: vi.fn(), selectNode,
		});
	});
	afterEach(() => {
		workflowCommandBridgeStore.setState({ isActive: false });
		addStep.mockClear();
	});

	it('adds the operation as a connector step before the named step', () => {
		const result = addMethodStep({ connectorId: 7, operationName: 'getAllUsers', anchorNodeId: 'b', position: 'before' });
		expect(result).toEqual({ kind: 'added', nodeId: 'new-1', method: 'getAllUsers', connector: 'CRM' });
		// Selected, so "it" in the next request means the new step.
		expect(selectNode).toHaveBeenCalledWith('new-1');
		expect(addStep.mock.calls[0]?.[0]).toMatchObject({
			sourceNodeId: 'a', direction: 'right', kind: 'connector', methodName: 'getAllUsers',
			connector: { connectorId: 7, title: 'CRM' }, methodOperation: { name: 'getAllUsers' },
		});
	});

	it('goes after the selected method when no step is named', () => {
		nodes[1] = node('a', 'connector', true);
		addMethodStep({ connectorId: 7, operationName: 'getAllUsers', anchorNodeId: null, position: 'before' });
		expect(addStep.mock.calls[0]?.[0]).toMatchObject({ sourceNodeId: 'a', direction: 'right' });
	});

	it('goes to the end of the workflow when nothing is named or selected', () => {
		addMethodStep({ connectorId: 7, operationName: 'getAllUsers', anchorNodeId: null, position: 'after' });
		expect(addStep.mock.calls[0]?.[0]).toMatchObject({ sourceNodeId: 'b' });
	});

	it('refuses while the editor cannot be changed', () => {
		workflowCommandBridgeStore.setState({ isEditable: () => false });
		expect(addMethodStep({ connectorId: 7, operationName: 'getAllUsers', anchorNodeId: null, position: 'after' })).toEqual({ kind: 'not-editable' });
		expect(addStep).not.toHaveBeenCalled();
	});

	it('does not add a connector\'s test operation or an unknown one', () => {
		expect(addMethodStep({ connectorId: 7, operationName: 'test', anchorNodeId: null, position: 'after' })).toEqual({ kind: 'unknown-operation' });
		expect(addMethodStep({ connectorId: 9, operationName: 'getAllUsers', anchorNodeId: null, position: 'after' })).toEqual({ kind: 'unknown-connector' });
	});
});
