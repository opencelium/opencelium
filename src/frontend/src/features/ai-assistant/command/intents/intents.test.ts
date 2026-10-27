import { beforeEach, describe, expect, it, vi } from 'vitest';
import { matchByName } from './matchByName';
import { resolveIntent } from './resolveIntent';

const responses: Record<string, unknown> = {};
vi.mock('@shared/api/apiExecutor', () => ({
	apiExecutor: vi.fn(async ({ url }: { url: string }) => responses[url] ?? []),
}));

describe('matchByName', () => {
	const names = ['i-doit → OTRS incidents', 'i-doit → Jira', 'fake2'];
	const match = (said: string) => matchByName(names, (name) => [name], said);

	it('matches regardless of separators and case', () => {
		expect(match('FAKE 2')).toBe('fake2');
		expect(match('idoit otrs')).toBe('i-doit → OTRS incidents');
	});

	it('leaves the choice to the user when two fit equally or none fits', () => {
		expect(match('idoit')).toBeUndefined();
		expect(match('zabbix')).toBeUndefined();
		expect(match('')).toBeUndefined();
	});
});

describe('resolveIntent', () => {
	beforeEach(() => {
		responses['/connection/all/meta'] = [{ id: 7, title: 'config item create/update' }, { id: 9, title: 'fake2' }];
		responses['/template/all?metadataOnly=true'] = [{ templateId: 'a1', name: 'idoit otrs incidents' }];
		responses['/connector/all'] = [
			{ connectorId: 1, title: 'CMDB prod', invoker: { name: 'i-doit' } },
			{ connectorId: 2, title: 'Helpdesk', invoker: { name: 'OTRS' } },
		];
	});

	it('fills a schedule with the matched workflow, titled after it', async () => {
		expect(await resolveIntent({ kind: 'schedule', workflow: 'fake2', title: '', cronExp: '0 0/15 * * * ?' }))
			.toEqual({ kind: 'schedule', values: { title: 'fake2', connectionId: 9, cronExp: '0 0/15 * * * ?' } });
		expect(await resolveIntent({ kind: 'schedule', workflow: 'nothing like it', title: 'Nightly', cronExp: '' }))
			.toEqual({ kind: 'schedule', values: { title: 'Nightly', connectionId: undefined, cronExp: '' } });
	});

	it('starts a workflow from the matched template, or from the template picker', async () => {
		const base = { kind: 'workflow', source: 'template', from: '', to: '', title: '', task: '' } as const;
		expect(await resolveIntent({ ...base, template: 'idoit otrs incidents' }))
			.toMatchObject({ kind: 'workflow', intent: { source: 'template', template: { templateId: 'a1' } } });
		expect(await resolveIntent({ ...base, template: 'unknown' })).toEqual({ kind: 'workflow', intent: { source: 'template-picker' } });
	});

	it('picks the AI connectors by system or title', async () => {
		const resolved = await resolveIntent({
			kind: 'workflow', source: 'ai', template: '', from: 'idoit', to: 'Helpdesk', title: 'Sync', task: 'create a ticket per object',
		});
		expect(resolved).toEqual({
			kind: 'workflow',
			intent: { source: 'ai', title: 'Sync', prompt: 'create a ticket per object', connectors: { fromId: 1, toId: 2 } },
		});
	});
});
