import { describe, expect, it } from 'vitest';
import { normalizeConnectionPayload } from './connectionPayload.normalizer';

const method = (name: string, index: string, extra: Record<string, unknown> = {}) => ({
	name, index, color: `#${name}`, ...extra,
});

const connectorsOf = (payload: unknown) =>
	normalizeConnectionPayload(payload).fromConnector.method.map((item: { name: string; connector: unknown }) => ({
		name: item.name, connector: item.connector,
	}));

describe('normalizeConnectionPayload connector resolution', () => {
	it('takes connectorId and title from the side when legacy methods carry no connector', () => {
		expect(connectorsOf({
			fromConnector: { connectorId: 36, title: 'CMDB', invoker: { name: 'i-doit' },
				methods: [method('read', '0')], operators: [] },
			toConnector: { connectorId: 6, title: null, invoker: { name: 'OTRS' },
				methods: [method('search', '0')], operators: [] },
		})).toEqual([
			{ name: 'read', connector: { connectorId: 36, title: 'CMDB', icon: null, invokerName: 'i-doit' } },
			{ name: 'search', connector: { connectorId: 6, title: 'DEFAULT', icon: null, invokerName: 'OTRS' } },
		]);
	});

	it('prefers the per-method connector over the side connector', () => {
		expect(connectorsOf({
			fromConnector: { connectorId: 36, invoker: { name: 'i-doit' }, operators: [],
				methods: [method('read', '0', {
					connector: { connectorId: 99, title: 'Own', icon: null, invoker: 'Jira' },
				})] },
		})).toEqual([
			{ name: 'read', connector: { connectorId: 99, title: 'Own', icon: null, invokerName: 'Jira' } },
		]);
	});

	it('keeps -1 for 5.x payloads whose side connector is the DEFAULT placeholder', () => {
		expect(connectorsOf({
			fromConnector: { connectorId: -1, title: 'DEFAULT', operators: [],
				methods: [method('read', '0', { connector: { connectorId: 12, title: 'A', invoker: 'X' } }),
					method('noConnector', '1')] },
			toConnector: null,
		})).toEqual([
			{ name: 'read', connector: { connectorId: 12, title: 'A', icon: null, invokerName: 'X' } },
			{ name: 'noConnector', connector: { connectorId: -1, title: 'DEFAULT', icon: null, invokerName: null } },
		]);
	});

	it('keeps an explicit null connector (HTTP request nodes) as null', () => {
		expect(connectorsOf({
			fromConnector: { connectorId: 36, operators: [], methods: [method('http', '0', { connector: null })] },
		})).toEqual([{ name: 'http', connector: null }]);
	});
});
