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
] as unknown as CommandNode<unknown>[];

describe('buildCommandCatalog', () => {
	it('lists only accessible commands, with value placeholders, effects and descriptions in both languages', () => {
		const catalog = buildCommandCatalog(tree, policy, t);
		expect(catalog.map((entry) => entry.phrase)).toEqual(['delete schedule by workflow.title <identifier>', 'help']);
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
	it('retries word by word and picks the option covering most of the requested words', async () => {
		const resolution = await resolveCommandArgument(resolveSchedules, 'idoit otrs schedule');
		expect(resolution).toEqual({ kind: 'match', option: { value: 'idoit → OTRS sync [12]', label: 'idoit → OTRS sync [12]' } });
	});

	it('asks the user to choose when the words fit several records equally', async () => {
		expect(await resolveCommandArgument(resolveSchedules, 'idoit')).toMatchObject({ kind: 'choose' });
	});

	it('reports a value nothing matches', async () => {
		expect(await resolveCommandArgument(async () => [], 'nothing')).toEqual({ kind: 'none' });
	});
});

describe('toCommandProposal', () => {
	const catalog = buildCommandCatalog(tree, policy, t);
	const answer = { argument: '', reply: 'Deletes it.', durationMs: 1, model: 'm' };

	it('builds the command with the resolved record', async () => {
		const proposal = await toCommandProposal({ ...answer, commandId: catalog[0]!.id, argument: 'idoit otrs' }, catalog);
		expect(proposal).toMatchObject({ kind: 'ready', phrase: 'delete schedule by workflow.title idoit → OTRS sync [12]' });
	});

	it('hands an unresolved command back to the palette to finish', async () => {
		const proposal = await toCommandProposal({ ...answer, commandId: catalog[0]!.id, argument: 'zzz' }, catalog);
		expect(proposal.kind).toBe('not-found');
		if (proposal.kind !== 'no-command') expect(editTextOf(proposal)).toBe('delete schedule by workflow.title ');
		expect(await toCommandProposal({ ...answer, commandId: null }, catalog)).toEqual({ kind: 'no-command', reply: 'Deletes it.' });
		expect(await toCommandProposal({ ...answer, commandId: 'help' }, catalog)).toMatchObject({ kind: 'ready', phrase: 'help' });
	});
});
