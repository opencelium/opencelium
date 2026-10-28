import { describe, expect, it } from 'vitest';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '@features/workflow/types/workflow.types';
import { buildWorkflowOutline, readableReferences } from './workflowOutline';

const node = (id: string, type: string, x: number, y: number, data: object) =>
	({ id, type, position: { x, y }, data: { title: id, kind: type, ...data } }) as unknown as WorkflowNodeModel;
const edge = (source: string, target: string, sourceHandle?: string, targetHandle?: string) =>
	({ id: `${source}-${target}`, source, target, sourceHandle, targetHandle }) as WorkflowEdgeModel;

/** Get hosts, then for each host create a config item named after it. */
const nodes = [
	node('start-1', 'start', 0, 0, {}),
	node('hosts', 'connector', 200, 0, { title: 'Get hosts', color: '#FFCFB5', connector: { connectorId: 1, title: 'Zabbix' },
		methodConfig: { name: 'host.get', url: '', headers: {}, queryParams: [], endpointArgs: {}, bodyFormat: 'json', bodyData: 'raw', body: {} } }),
	node('loop', 'loop', 400, 0, { title: 'Loop', conditionConfig: { operatorType: 'loop', tree: {}, iterator: 'i',
		expression: 'for {%#FFCFB5.(response).body.$.result[*]%}' } }),
	node('create', 'connector', 400, 200, { title: 'Create config item', color: '#98BEC7', connector: { connectorId: 2, title: 'OTRS' },
		methodConfig: { name: 'ConfigItemCreate', url: '', headers: {}, queryParams: [], endpointArgs: {}, bodyFormat: 'json', bodyData: 'raw',
			body: { ConfigItem: { Name: '#FFCFB5.(response).body.$.result[i].host', Class: 'Computer', DeplState: '' } } } }),
];
const edges = [edge('start-1', 'hosts'), edge('hosts', 'loop'), edge('loop', 'create', 'bottom', 'top')];

describe('buildWorkflowOutline', () => {
	it('lists the steps in tree order under their loop, with operations, systems and the fields they fill', () => {
		expect(buildWorkflowOutline(nodes, edges)).toBe([
			'Get hosts — host.get on Zabbix',
			'For each i of Get hosts › result[*]:',
			'  Create config item — ConfigItemCreate on OTRS',
			'      sets ConfigItem.Name from Get hosts › result[i].host',
			'      sets ConfigItem.Class = "Computer"',
		].join('\n'));
	});
});

describe('readableReferences', () => {
	it('names the step a reference reads instead of its color', () => {
		const steps = new Map([['#FFCFB5', 'Get hosts']]);
		expect(readableReferences('{%#ffcfb5.(response).body.$.result[i].host%} == "x"', steps)).toBe('Get hosts › result[i].host == "x"');
		expect(readableReferences('#ABCDEF.(response).status', steps)).toBe('an earlier step › status');
	});
});
