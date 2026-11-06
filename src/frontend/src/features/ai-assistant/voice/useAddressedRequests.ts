import { message } from 'antd';
import { useEffect, useEffectEvent } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { notifyError } from '@shared/ui/feedback/notifyError';
import type { AiCommandAssist, AskOutcome } from '../command/useAiCommandAssist';
import { SPOKEN_REQUEST_TOAST_KEY, useSpokenRequestStore } from './spokenRequest.store';
import { useOpenConfirmStore } from '@shared/ui/confirm/openConfirm.store';
import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge';
import { showBeebotCapabilities } from '../ui/BeebotCapabilities/showBeebotCapabilities';
import { useBeebotReplyStore } from './beebotReply.store';
import { isCapabilitiesQuestion, splitRequests } from './spokenAnswers';

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
	const handle = useEffectEvent(async (text: string) => {
		const reply = useBeebotReplyStore.getState();
		reply.begin();
		if (isCapabilitiesQuestion(text)) {
			message.destroy(SPOKEN_REQUEST_TOAST_KEY);
			reply.reply(showBeebotCapabilities(workflowCommandBridgeStore.getState().isActive));
			reply.end();
			return;
		}
		// "Do A and then B": one after the other; B is not asked once A did not go through, or "stop" was said.
		const cancelCount = useSpokenRequestStore.getState().cancelCount;
		let outcome: AskOutcome = { kind: 'done' };
		let asked = text;
		for (const part of splitRequests(text)) {
			asked = part;
			outcome = await assist.ask(part, { isAddressed: true });
			if (outcome.kind !== 'done' || useSpokenRequestStore.getState().cancelCount !== cancelCount) break;
		}
		message.destroy(SPOKEN_REQUEST_TOAST_KEY);
		const fail = (error: string) => {
			notifyError(error);
			reply.reply(error);
		};
		switch (outcome.kind) {
			case 'done':
				reply.end(t('commandPalette.beebot.done'));
				return;
			case 'answer':
				onAnswer(asked);
				reply.end(t('commandPalette.beebot.lookAtPalette'));
				return;
			case 'error':
				fail(t(`commandPalette.ai.${outcome.error}`));
				reply.end();
				return;
			case 'skipped':
				// Superseded by a newer request, which closes the toast itself; else the AI is not there to ask.
				if (!assist.isAvailable) fail(t('commandPalette.ai.unreachable'));
				reply.end();
				return;
			default: {
				const _exhaustive: never = outcome;
				return _exhaustive;
			}
		}
	});
	const cancel = useEffectEvent(() => {
		assist.reset();
		useBeebotReplyStore.getState().end();
	});
	useEffect(() => useSpokenRequestStore.subscribe((state, previous) => {
		if (state.cancelCount !== previous.cancelCount) cancel();
		if (!state.pending) return;
		const text = useSpokenRequestStore.getState().take();
		if (text) void handle(text);
	}), []);
	// A question Beebot asks while answering ("Remove CreateTicket?") is said aloud, so it can be answered by voice.
	useEffect(() => useOpenConfirmStore.subscribe((state, previous) => {
		if (state.current && state.current !== previous.current && state.current.text) {
			useBeebotReplyStore.getState().reply(state.current.text);
		}
	}), []);
}
