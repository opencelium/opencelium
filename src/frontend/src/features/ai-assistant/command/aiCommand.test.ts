import type { TFunction } from 'i18next';
import { describe, expect, it, vi } from 'vitest';
import type { PolicyContext } from '@/engine/policy';
import type { CommandNode, SuggestionOption } from '@shared/command/types';
import { buildCommandCatalog } from './buildCommandCatalog';
import { editTextOf, toCommandProposal } from './commandProposal';
import { resolveCommandArgument } from './resolveCommandArgument';

vi.mock('@/engine/entity/EntityRegistry', () => ({
	entityRegistry: {
		has: (name: string) => name === 'schedule',
		get: () => ({ list: { titleKey: 'schedule.list.title' } }),
	},
}));
vi.mock('@/engine/policy', () => ({
	policyEngine: { evaluate: (access: { allowed: boolean }) => ({ allowed: access.allowed }) },
}));

const TEXTS: Record<string, Record<string, string>> = {
	en: { 'commandPalette.descriptions.delete': 'Delete an entry', 'schedule.list.title': 'Schedules' },
	de: { 'commandPalette.descriptions.delete': 'Einen Eintrag löschen', 'schedule.list.title': 'Zeitpläne' },
};
const translator = (lng: string) => ((key: string) => TEXTS[lng]?.[key] ?? key) as unknown as TFunction;
const t = { en: translator('en'), de: translator('de') };
const policy = {} as PolicyContext;

const resolveSchedules = vi.fn(async (input?: unknown): Promise<SuggestionOption[]> =>
	String(input).includes('otrs') || input === 'idoit' ? ['idoit → OTRS sync [12]', 'idoit → Jira [14]'] : []);
const tree = [
	{
		type: 'literal', value: 'delete', aliases: ['remove'], description: 'commandPalette.descriptions.delete', effect: 'destructive', icon: 'delete',
		children: [{
			type: 'literal', value: 'schedule', entityName: 'schedule',
			children: [{ type: 'literal', value: 'by', children: [{ type: 'literal', value: 'workflow.title', children: [
				{ type: 'entity', name: 'identifier', resolve: resolveSchedules, execute: () => undefined },
			] }] }],
		}, {
			type: 'literal', value: 'user', access: { allowed: false },
			children: [{ type: 'entity', name: 'identifier', execute: () => undefined }],
		}],
	},
	{ type: 'literal', value: 'help', execute: () => undefined },
	{
		type: 'literal', value: 'search', effect: 'open', children: [{ type: 'literal', value: 'schedule', children: [
			{ type: 'entity', name: 'identifier', resolve: resolveSchedules, execute: () => undefined },
		] }],
	},
	{ type: 'literal', value: 'create', effect: 'open', children: [{ type: 'literal', value: 'schedule', execute: () => undefined }] },
] as unknown as CommandNode<unknown>[];

describe('buildCommandCatalog', () => {
	it('lists only accessible commands, with value placeholders, effects and descriptions in both languages', () => {
		const catalog = buildCommandCatalog(tree, policy, t);
		expect(catalog.map((entry) => entry.phrase)).toEqual([
			'delete schedule by workflow.title <identifier>', 'help', 'search schedule <identifier>', 'create schedule',
		]);
		expect(catalog[0]).toMatchObject({
			prefix: 'delete schedule by workflow.title',
			effect: 'destructive',
			icon: 'delete',
			description: 'Delete an entry · Einen Eintrag löschen. Schedules (Zeitpläne). Also: remove',
			argument: { name: 'identifier' },
		});
		expect(catalog[1]).toMatchObject({ effect: 'run', description: '' });
	});
});

describe('resolveCommandArgument', () => {
	it('ranks several records by how many requested words they contain', async () => {
		const resolution = await resolveCommandArgument(resolveSchedules, 'idoit otrs schedule');
		expect(resolution).toMatchObject({ kind: 'ranked', options: [{ label: 'idoit → OTRS sync [12]' }, { label: 'idoit → Jira [14]' }] });
	});

	it('treats the only record found, or one named exactly, as certain', async () => {
		const only = async () => ['admin@opencelium.io'];
		expect(await resolveCommandArgument(only, 'admin')).toEqual({ kind: 'single', option: { value: 'admin@opencelium.io', label: 'admin@opencelium.io' } });
		expect(await resolveCommandArgument(resolveSchedules, 'idoit → jira [14]')).toMatchObject({ kind: 'single' });
	});

	it('reports a value nothing matches', async () => {
		expect(await resolveCommandArgument(async () => [], 'nothing')).toEqual({ kind: 'none' });
	});
});

describe('toCommandProposal', () => {
	const catalog = buildCommandCatalog(tree, policy, t);
	const [remove, help, search, create] = catalog;
	const answer = { argument: '', reply: 'Done.', durationMs: 1, model: 'm' };
	const onlyRecord = vi.fn(async (): Promise<SuggestionOption[]> => ['idoit → OTRS sync [12]']);

	it('runs a command that opens a page or wizard by itself once its record is certain', async () => {
		expect(await toCommandProposal({ ...answer, commandId: create!.id }, catalog)).toMatchObject({ kind: 'ready', isAutoRun: true });
		const withOne = [{ ...search!, argument: { name: 'identifier', resolve: onlyRecord } }];
		expect(await toCommandProposal({ ...answer, commandId: search!.id, argument: 'otrs' }, withOne))
			.toMatchObject({ kind: 'ready', isAutoRun: true, phrase: 'search schedule idoit → OTRS sync [12]' });
		expect(await toCommandProposal({ ...answer, commandId: help!.id }, catalog)).toMatchObject({ kind: 'ready', isAutoRun: false });
	});

	it('lets the user pick among several records, closest first', async () => {
		const proposal = await toCommandProposal({ ...answer, commandId: search!.id, argument: 'idoit otrs' }, catalog);
		expect(proposal).toMatchObject({ kind: 'choose', options: [{ phrase: 'search schedule idoit → OTRS sync [12]' }, {}] });
	});

	it('never deletes by itself: even the only record is offered as a choice', async () => {
		const withOne = [{ ...remove!, argument: { name: 'identifier', resolve: onlyRecord } }];
		const proposal = await toCommandProposal({ ...answer, commandId: remove!.id, argument: 'otrs' }, withOne);
		expect(proposal).toEqual({
			kind: 'choose', entry: withOne[0], argument: 'otrs',
			options: [{ phrase: 'delete schedule by workflow.title idoit → OTRS sync [12]', label: 'delete schedule by workflow.title idoit → OTRS sync [12]', record: 'idoit → OTRS sync [12]' }],
		});
	});

	it('hands an unresolved command back to the palette to finish', async () => {
		const proposal = await toCommandProposal({ ...answer, commandId: remove!.id, argument: 'zzz' }, catalog);
		expect(proposal.kind).toBe('not-found');
		if (proposal.kind === 'not-found') expect(editTextOf(proposal)).toBe('delete schedule by workflow.title ');
		expect(await toCommandProposal({ ...answer, commandId: null }, catalog)).toEqual({ kind: 'no-command', reply: 'Done.' });
	});
});
