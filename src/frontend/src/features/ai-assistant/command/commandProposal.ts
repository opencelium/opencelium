import type { RouteCommandResponse } from '../model/aiGateway.types';
import type { CatalogEntry } from './buildCommandCatalog';
import { resolveCommandArgument } from './resolveCommandArgument';
import { type ResolvedIntent, resolveIntent } from './intents/resolveIntent';

/** `record` is the chosen record's label, shown apart from the command words so a long command never hides it. */
export type ProposedCommand = { phrase: string; label: string; record?: string };

/**
 * What the AI proposes for a prompt. `ready` runs on a click, or by itself when `isAutoRun`; `choose` lists the records to
 * pick from; the rest hand the command back to the palette to finish.
 */
export type AiCommandProposal =
	| ({ kind: 'ready'; entry: CatalogEntry; reply: string; isAutoRun: boolean } & ProposedCommand)
	| { kind: 'choose'; entry: CatalogEntry; argument: string; options: ProposedCommand[] }
	| { kind: 'not-found'; entry: CatalogEntry; argument: string }
	| { kind: 'needs-value'; entry: CatalogEntry }
	| { kind: 'no-command'; reply: string }
	/** A create command with values from the request: opens its form filled in, so it runs by itself. */
	| { kind: 'action'; entry: CatalogEntry; resolved: ResolvedIntent; reply: string };

const MAX_OPTIONS = 8;

export const toCatalogItem = ({ id, phrase, description }: CatalogEntry) => ({ id, phrase, description });

/**
 * Opening a page or wizard is harmless and shows the record before anything changes, so a command that opens one
 * runs by itself once its record is certain. A delete always waits for the user to pick the record, even the only one.
 */
export async function toCommandProposal(answer: RouteCommandResponse, catalog: CatalogEntry[]): Promise<AiCommandProposal> {
	const { reply } = answer;
	const entry = catalog.find((candidate) => candidate.id === answer.commandId);
	if (!entry) return { kind: 'no-command', reply };
	if (answer.intent) return { kind: 'action', entry, resolved: await resolveIntent(answer.intent), reply };
	const isOpening = entry.effect === 'open';
	if (!entry.argument) return { kind: 'ready', entry, reply, phrase: entry.prefix, label: entry.prefix, isAutoRun: isOpening };
	const argument = answer.argument.trim();
	if (!argument) return { kind: 'needs-value', entry };
	if (!entry.argument.resolve) {
		const phrase = `${entry.prefix} ${argument}`;
		return { kind: 'ready', entry, reply, phrase, label: phrase, isAutoRun: false };
	}
	const resolution = await resolveCommandArgument(entry.argument.resolve, argument);
	const toCommand = (option: { value: string; label: string }): ProposedCommand => ({
		phrase: `${entry.prefix} ${option.value}`,
		label: `${entry.prefix} ${option.label}`,
		record: option.label,
	});
	switch (resolution.kind) {
		case 'single':
			return entry.effect === 'destructive'
				? { kind: 'choose', entry, argument, options: [toCommand(resolution.option)] }
				: { kind: 'ready', entry, reply, isAutoRun: isOpening, ...toCommand(resolution.option) };
		case 'ranked':
			return { kind: 'choose', entry, argument, options: resolution.options.slice(0, MAX_OPTIONS).map(toCommand) };
		case 'none':
			return { kind: 'not-found', entry, argument };
		default: {
			const _exhaustive: never = resolution;
			return _exhaustive;
		}
	}
}

/** The palette text to continue from: the full command, or the command with the value still to type. */
export function editTextOf(proposal: Extract<AiCommandProposal, { kind: 'ready' | 'not-found' | 'needs-value' }>): string {
	return proposal.kind === 'ready' ? proposal.phrase : `${proposal.entry.prefix} `;
}
