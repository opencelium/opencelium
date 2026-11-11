import { useEffect, useEffectEvent } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { notifyError } from '@shared/ui/feedback/notifyError';
import type { AiCommandAssist, AskOutcome } from '../command/useAiCommandAssist';
import { useSpokenRequestStore } from './spokenRequest.store';
import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge';
import { showBeebotCapabilities } from '../ui/BeebotCapabilities/showBeebotCapabilities';
import { isCapabilitiesQuestion, splitRequests } from './spokenAnswers';
import { quietly } from '../editor/tell';

type Params = {
	assist: AiCommandAssist;
	/** The request needs the user (a question, a delete to confirm, a missing value): show its answer in the palette. */
	onAnswer: (text: string) => void;
};

/**
 * Requests said to the always-listening assistant by name: no palette, only the "thinking" toast while the AI works,
 * then it acts. The palette opens only for an answer the user has to look at; a failure is a notification.
 */
export function useAddressedRequests({ assist, onAnswer }: Params) {
	const { t } = useI18n('common');
	const answer = async (text: string): Promise<AskOutcome> => {
		if (isCapabilitiesQuestion(text)) {
			showBeebotCapabilities(workflowCommandBridgeStore.getState().isActive);
			return { kind: 'done' };
		}
		// "Do A and then B": one after the other; B is not asked once A did not go through, or "stop" was said.
		const cancelCount = useSpokenRequestStore.getState().cancelCount;
		let outcome: AskOutcome = { kind: 'done' };
		let asked = text;
		for (const part of splitRequests(text)) {
			asked = part;
			outcome = await quietly(() => assist.ask(part, { isAddressed: true }));
			if (outcome.kind !== 'done' || useSpokenRequestStore.getState().cancelCount !== cancelCount) break;
		}
		switch (outcome.kind) {
			case 'done':
			case 'no-command':
				break;
			case 'answer':
				onAnswer(asked);
				break;
			case 'error':
				notifyError(t(`commandPalette.ai.${outcome.error}`));
				break;
			case 'skipped':
				// Superseded by a newer request, which closes the toast itself; else the AI is not there to ask.
				if (!assist.isAvailable) notifyError(t('commandPalette.ai.unreachable'));
				break;
			default: {
				const _exhaustive: never = outcome;
				return _exhaustive;
			}
		}
		return outcome;
	};
	const handle = useEffectEvent(async (text: string) => {
		await answer(text).catch(() => undefined);
	});
	const cancel = useEffectEvent(() => {
		assist.reset();
	});
	useEffect(() => useSpokenRequestStore.subscribe((state, previous) => {
		if (state.cancelCount !== previous.cancelCount) cancel();
		if (!state.pending) return;
		const text = useSpokenRequestStore.getState().take();
		if (text) void handle(text);
	}), []);
}
