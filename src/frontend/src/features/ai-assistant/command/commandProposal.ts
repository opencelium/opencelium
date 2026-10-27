import type { RouteCommandResponse } from '../model/aiGateway.types';
import type { CatalogEntry } from './buildCommandCatalog';
import { resolveCommandArgument } from './resolveCommandArgument';

/** What the AI proposes for a prompt; only `ready` runs as is, the others hand the command to the user to finish. */
export type AiCommandProposal =
	| { kind: 'ready'; entry: CatalogEntry; phrase: string; label: string; reply: string }
	| { kind: 'choose'; entry: CatalogEntry; argument: string; reply: string }
	| { kind: 'not-found'; entry: CatalogEntry; argument: string; reply: string }
	| { kind: 'needs-value'; entry: CatalogEntry; reply: string }
	| { kind: 'no-command'; reply: string };

export const toCatalogItem = ({ id, phrase, description }: CatalogEntry) => ({ id, phrase, description });

export async function toCommandProposal(answer: RouteCommandResponse, catalog: CatalogEntry[]): Promise<AiCommandProposal> {
	const { reply } = answer;
	const entry = catalog.find((candidate) => candidate.id === answer.commandId);
	if (!entry) return { kind: 'no-command', reply };
	if (!entry.argument) return { kind: 'ready', entry, phrase: entry.prefix, label: entry.prefix, reply };
	const argument = answer.argument.trim();
	if (!argument) return { kind: 'needs-value', entry, reply };
	if (!entry.argument.resolve) {
		const phrase = `${entry.prefix} ${argument}`;
		return { kind: 'ready', entry, phrase, label: phrase, reply };
	}
	const resolution = await resolveCommandArgument(entry.argument.resolve, argument);
	switch (resolution.kind) {
		case 'match':
			return {
				kind: 'ready', entry, reply,
				phrase: `${entry.prefix} ${resolution.option.value}`,
				label: `${entry.prefix} ${resolution.option.label}`,
			};
		case 'choose':
			return { kind: 'choose', entry, argument, reply };
		case 'none':
			return { kind: 'not-found', entry, argument, reply };
		default: {
			const _exhaustive: never = resolution;
			return _exhaustive;
		}
	}
}

/** The palette text to continue from: the full command, or the command with the value to pick or type. */
export function editTextOf(proposal: Exclude<AiCommandProposal, { kind: 'no-command' }>): string {
	switch (proposal.kind) {
		case 'ready':
			return proposal.phrase;
		case 'choose':
			return `${proposal.entry.prefix} ${proposal.argument}`;
		case 'not-found':
		case 'needs-value':
			return `${proposal.entry.prefix} `;
		default: {
			const _exhaustive: never = proposal;
			return _exhaustive;
		}
	}
}
