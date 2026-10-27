import type { AiCommandProposal } from './commandProposal';
import type { AiCommandState } from './useAiCommandAssist';

/** The cmdk item values of the AI group, shared by the items and the palette that highlights them. */
export const AI_ITEM = {
	ask: 'ai:ask',
	thinking: 'ai:thinking',
	retry: 'ai:retry',
	none: 'ai:none',
	choose: 'ai:choose',
	run: 'ai:run',
	edit: 'ai:edit',
	finish: 'ai:finish',
	option: (phrase: string) => `ai:option:${phrase}`,
} as const;

function firstOfProposal(proposal: AiCommandProposal): string | undefined {
	switch (proposal.kind) {
		case 'ready':
		case 'action':
			return AI_ITEM.run;
		case 'choose':
			return proposal.options[0] ? AI_ITEM.option(proposal.options[0].phrase) : undefined;
		case 'not-found':
		case 'needs-value':
			return AI_ITEM.finish;
		case 'no-command':
			return undefined;
		default: {
			const _exhaustive: never = proposal;
			return _exhaustive;
		}
	}
}

/** The item Enter should act on for an answer (or a failure); none while the AI is thinking or idle. */
export function firstActionableAiItem(state: AiCommandState): string | undefined {
	if (state.status === 'done') return firstOfProposal(state.proposal);
	return state.status === 'error' ? AI_ITEM.retry : undefined;
}
