import { describe, expect, it } from 'vitest';
import type { Connector } from '@entities/connector/model/types';
import { mapConnectionToWorkflowState } from '@features/workflow/api/connectionMapper';
import type { WorkflowDsl } from '../model/workflowDsl.schema';
import { dslToConnection } from './dslToConnection';

const body = (fields: unknown) => ({ type: 'object', format: 'json', data: 'raw', fields });
const response = (fields: unknown) => ({
	name: 'response',
	success: { status: '200', header: {}, body: body(fields) },
	fail: { status: '400', header: {}, body: body({}) },
});
const connector = (connectorId: number, title: string, operations: unknown[]) =>
	({ connectorId, title, icon: null, invoker: { name: title, operations } }) as unknown as Connector;

const idoit = connector(1, 'i-doit', [{
	name: 'cmdb.objects.read', type: '',
	request: { endpoint: '{url}', method: 'POST', header: {}, body: body({}) },
	response: response({ result: [{ title: '', cmdb_status_title: '' }] }),
}]);
const otrs = connector(2, 'otrs', [{
	name: 'ConfigItemCreate', type: '',
	request: { endpoint: '{url}', method: 'POST', header: {}, body: body({ ConfigItem: { Name: '', InciState: '' } }) },
	response: response({ ConfigItemID: '' }),
}]);

const code = "RESULT_VAR = 'Operational';\nif (VAR_0 != 'in operation') { RESULT_VAR = 'Incident'; }";
const dsl: WorkflowDsl = {
	steps: [
		{ id: 's1', kind: 'method', connector: 'from', operation: 'cmdb.objects.read', params: [], fields: [] },
		{ id: 's2', kind: 'loop', over: { step: 's1', path: 'result' }, body: [{
			id: 's3', kind: 'method', connector: 'to', operation: 'ConfigItemCreate', params: [],
			fields: [
				{ name: 'ConfigItem.Name', value: { ref: { step: 's2', path: 'title' } } },
				{ name: 'ConfigItem.InciState', value: { script: {
					inputs: [{ step: 's2', path: 'cmdb_status_title' }, { step: 's2', path: 'title' }],
					code, description: 'Map the i-doit status to an OTRS incident state',
				} } },
			],
		}] },
	],
};

const generated = dslToConnection(dsl, { from: idoit, to: otrs });
const [source, target] = generated.fromConnector.method;

describe('script values on Apply', () => {
	it('become a field binding in the saved shape, inputs as VAR_n and the field as RESULT_VAR', () => {
		expect(generated.fieldBinding).toEqual([{
			nodeId: null,
			from: [
				{ color: source?.color, type: 'response', field: 'body.$.result[i].cmdb_status_title' },
				{ color: source?.color, type: 'response', field: 'body.$.result[i].title' },
			],
			to: [{ color: target?.color, type: 'request', field: 'body.$.ConfigItem.InciState' }],
			enhancement: expect.objectContaining({
				language: 'js', expertCode: code, description: 'Map the i-doit status to an OTRS incident state',
				expertVar: [
					`//var RESULT_VAR = ${target?.color}.(request).body.$.ConfigItem.InciState;`,
					`//var VAR_0 = ${source?.color}.(response).body.$.result[i].cmdb_status_title;`,
					`//var VAR_1 = ${source?.color}.(response).body.$.result[i].title;`,
				].join('\n'),
			}),
		}]);
	});

	it('fill the field with the joined inputs, like a stored transformation', () => {
		expect(target?.request.body.fields).toEqual({ ConfigItem: {
			Name: `${source?.color}.(response).body.$.result[i].title`,
			InciState: `${source?.color}.(response).body.$.result[i].cmdb_status_title;${source?.color}.(response).body.$.result[i].title`,
		} });
	});

	it('load as bindings the transformation editor reads (script and VAR_n / RESULT_VAR args)', () => {
		const [binding] = mapConnectionToWorkflowState(generated).fieldBindings;
		expect(binding.enhancement).toMatchObject({
			script: code,
			args: {
				RESULT_VAR: `${target?.color}.(request).body.$.ConfigItem.InciState`,
				VAR_0: `${source?.color}.(response).body.$.result[i].cmdb_status_title`,
				VAR_1: `${source?.color}.(response).body.$.result[i].title`,
			},
		});
	});
});

describe('fields below declared objects', () => {
	it('are written into the body template next to what the invoker declares', () => {
		const withData = connector(2, 'otrs', [{
			name: 'ConfigItemCreate', type: '',
			request: { endpoint: '{url}', method: 'POST', header: {}, body: body({ ConfigItem: { Name: '', CIXMLData: { Vendor: '' } } }) },
			response: response({ ConfigItemID: '' }),
		}]);
		const extended: WorkflowDsl = { steps: [
			{ id: 's1', kind: 'method', connector: 'from', operation: 'cmdb.objects.read', params: [], fields: [] },
			{ id: 's2', kind: 'loop', over: { step: 's1', path: 'result' }, body: [{
				id: 's3', kind: 'method', connector: 'to', operation: 'ConfigItemCreate', params: [],
				fields: [
					{ name: 'ConfigItem.CIXMLData.IdoitObjectID', value: { ref: { step: 's2', path: 'id' } } },
					{ name: 'ConfigItem.CIXMLData.Tenant', value: { literal: 'i-doit' } },
				],
			}] },
		] };
		const [read, create] = dslToConnection(extended, { from: idoit, to: withData }).fromConnector.method;
		expect(create?.request.body.fields).toEqual({ ConfigItem: { Name: '', CIXMLData: {
			Vendor: '', IdoitObjectID: `${read?.color}.(response).body.$.result[i].id`, Tenant: 'i-doit',
		} } });
	});
});
