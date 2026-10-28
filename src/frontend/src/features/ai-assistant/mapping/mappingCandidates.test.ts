import { describe, expect, it } from 'vitest';
import type { Connection, MethodWithId } from '@features/workflow/types/connection';
import { collectMappingSources, collectMappingTargets, setTargetValue } from './mappingCandidates';

const method = (id: string, index: string, color: string, name: string, response: unknown, body: unknown = {}) => ({
	id, index, color, name, connector: { connectorId: 1, title: id === 'm-hosts' ? 'Zabbix' : 'i-doit' },
	request: { body: { fields: body } }, response: { success: { body: { fields: response } } },
}) as unknown as MethodWithId;

/** host.get (0), then for each host (1) read the object (1_0) and create a config item (1_1). */
const hosts = method('m-hosts', '0', '#FFCFB5', 'host.get', { result: [{ host: '', hostid: '', interfaces: [{ ip: '' }] }] });
const object = method('m-object', '1_0', '#C77E7E', 'cmdb.objects.read', { result: [{ id: '', title: '' }] });
const create = method('m-create', '1_1', '#98BEC7', 'ConfigItemCreate', {},
	{ ConfigItem: { Name: '', Class: 'Computer', Tags: [''] } });

const connection = {
	fromConnector: {
		method: [hosts, object, create],
		operator: [{ id: 'o', index: '1', type: 'loop', iterator: 'i', expression: 'for {%#FFCFB5.(response).body.$.result[*]%}' }],
	},
	fieldBindings: [],
	ui: {},
} as unknown as Connection;

describe('collectMappingSources', () => {
	const sources = collectMappingSources(connection, create);

	it('reads the array a surrounding loop runs over at the loop element, other arrays at their first element', () => {
		expect(sources.map((source) => `${source.step} › ${source.path}`)).toEqual([
			'cmdb.objects.read › result[0].id', 'cmdb.objects.read › result[0].title',
			'host.get › result[i].host', 'host.get › result[i].hostid', 'host.get › result[i].interfaces[0].ip',
		]);
	});

	it('writes each value as the reference the body editor uses', () => {
		expect(sources.find((source) => source.path === 'result[i].host')).toMatchObject({
			id: 's3', system: 'Zabbix', reference: '#FFCFB5.(response).body.$.result[i].host',
		});
	});

	it('offers nothing from steps after the edited one', () => {
		expect(collectMappingSources(connection, hosts)).toEqual([]);
	});
});

describe('collectMappingTargets', () => {
	it('lists every leaf with its current value and its place in the JSON editor', () => {
		expect(collectMappingTargets(create.request.body.fields)).toEqual([
			{ path: 'ConfigItem.Name', namespace: ['ConfigItem'], name: 'Name', current: '' },
			{ path: 'ConfigItem.Class', namespace: ['ConfigItem'], name: 'Class', current: 'Computer' },
			{ path: 'ConfigItem.Tags[0]', namespace: ['ConfigItem', 'Tags'], name: '0', current: '' },
		]);
	});
});

describe('setTargetValue', () => {
	it('sets one leaf, arrays included, without touching the original body', () => {
		const body = create.request.body.fields;
		const [name, , tag] = collectMappingTargets(body);
		const updated = setTargetValue(setTargetValue(body, name!, '#FFCFB5.(response).body.$.result[i].host'), tag!, 'x');
		expect(updated).toEqual({ ConfigItem: { Name: '#FFCFB5.(response).body.$.result[i].host', Class: 'Computer', Tags: ['x'] } });
		expect(body).toEqual({ ConfigItem: { Name: '', Class: 'Computer', Tags: [''] } });
	});
});

describe('applyProposals', () => {
	it('writes the references and keeps a binding for each, as the JSON editor does', async () => {
		const { applyProposals } = await import('./useAiFieldMapping');
		const [name] = collectMappingTargets(create.request.body.fields);
		const [source] = collectMappingSources(connection, create).filter((candidate) => candidate.path === 'result[i].host');
		const result = applyProposals(connection, create, create.request.body.fields, [{ target: name!, source: source!, reason: '' }]);
		expect(result.body).toMatchObject({ ConfigItem: { Name: '#FFCFB5.(response).body.$.result[i].host' } });
		expect(result.fieldBindings.map((binding) => binding.enhancement?.args?.RESULT_VAR)).toEqual(['#98BEC7.(request).body.$.ConfigItem.Name']);
	});
});

describe('collectConditionSources', () => {
	it('reads the loop item at the iterator and other lists whole, for conditions such as "the names contain X"', async () => {
		const { collectConditionSources } = await import('./mappingCandidates');
		const sources = collectConditionSources(connection, [hosts, object], '1_2');
		expect(sources.map((source) => `${source.step} › ${source.path}`)).toEqual([
			'cmdb.objects.read › result[*].id', 'cmdb.objects.read › result[*].title',
			'host.get › result[i].host', 'host.get › result[i].hostid', 'host.get › result[i].interfaces[*].ip',
		]);
	});
});
