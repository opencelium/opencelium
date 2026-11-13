import { expect, it } from 'vitest';
import type { LoggedExecution } from '@features/logs';
import type { WorkflowNodeModel } from '../../types/workflow.types';
import { findLoggedWorkflowMethod, readSavedMethodLocations } from './findLoggedWorkflowMethod';

const node = {
	id: 'step', type: 'connector', data: {
		color: '#aabbcc', connector: { connectorId: 11 }, methodConfig: { name: 'GetItem', method: 'GET' },
	},
} as WorkflowNodeModel;
const execution = {
	location: { direction: 'source', indexPath: '0' },
	method: { properties: { name: 'GetItem', operationId: '#aabbcc', connectorId: '11' } },
} as LoggedExecution;
const currentIndexes = new Map([['step', '0']]);

it('rejects a deleted step and steps with a replaced method or connector', () => {
	expect(findLoggedWorkflowMethod(execution, [node], currentIndexes)).toBe(node);
	expect(findLoggedWorkflowMethod(execution, [], currentIndexes)).toBeNull();
	expect(findLoggedWorkflowMethod({
		...execution, method: { ...execution.method, properties: { ...execution.method.properties, name: 'PutItem' } },
	}, [node], currentIndexes)).toBeNull();
	expect(findLoggedWorkflowMethod({
		...execution, method: { ...execution.method, properties: { ...execution.method.properties, connectorId: '12' } },
	}, [node], currentIndexes)).toBeNull();
});

it('matches a legacy target method after the canvas merges the two flowcharts', () => {
	const methodLocations = readSavedMethodLocations({
		fromConnector: { methods: [{ color: '#001122', index: 0 }] },
		toConnector: { methods: [{ color: '#aabbcc', index: 0 }] },
	});
	expect(findLoggedWorkflowMethod({
		...execution, location: { ...execution.location, direction: 'target' }, methodLocations,
	}, [node], new Map([['step', '1']]))).toBe(node);
});
