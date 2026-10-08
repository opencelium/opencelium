import { describe, expect, it } from 'vitest';
import { mapConnectionToWorkflowState } from '../../api/connectionMapper';
import { extractConnectorGroups } from './templateConnectorMapping.utils';

const method = (name: string, index: string, color: string) => ({
	name, index, color, label: null,
	request: { endpoint: '{url}', method: 'POST', body: { type: 'object', format: 'json', data: 'raw', fields: {} } },
	response: { success: { status: '200' }, fail: { status: '500' } },
});

const legacyTemplateConnection = {
	title: 'legacy', description: '',
	fromConnector: {
		connectorId: 36, title: null, invoker: { name: 'i-doit' },
		methods: [method('cmdb.objects.read', '0', '#FFCFB5')], operators: [],
	},
	toConnector: {
		connectorId: 6, title: null, invoker: { name: 'OTRS' },
		methods: [method('ConfigItemSearch', '0', '#6477AB'), method('ConfigItemGet', '1', '#98BEC7')],
		operators: [],
	},
};

describe('extractConnectorGroups for legacy two-sided templates', () => {
	it('keeps one group per side connector instead of collapsing into one', () => {
		const { nodes } = mapConnectionToWorkflowState(legacyTemplateConnection);
		const groups = extractConnectorGroups(nodes);

		expect(groups.map(({ oldConnectorId, invokerName, methodNames }) => ({
			oldConnectorId, invokerName, count: methodNames.length,
		}))).toEqual([
			{ oldConnectorId: 36, invokerName: 'i-doit', count: 1 },
			{ oldConnectorId: 6, invokerName: 'OTRS', count: 2 },
		]);
	});
});
