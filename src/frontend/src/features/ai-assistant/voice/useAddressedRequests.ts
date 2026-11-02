import { message } from 'antd';
import { useEffect, useEffectEvent } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { notifyError } from '@shared/ui/feedback/notifyError';
import type { AiCommandAssist } from '../command/useAiCommandAssist';
import { SPOKEN_REQUEST_TOAST_KEY, useSpokenRequestStore } from './spokenRequest.store';

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
		const outcome = await assist.ask(text, { isAddressed: true });
		message.destroy(SPOKEN_REQUEST_TOAST_KEY);
		switch (outcome.kind) {
			case 'done':
				return;
			case 'answer':
				onAnswer(text);
				return;
			case 'error':
				notifyError(t(`commandPalette.ai.${outcome.error}`));
				return;
			case 'skipped':
				// Superseded by a newer request, which closes the toast itself; else the AI is not there to ask.
				if (!assist.isAvailable) notifyError(t('commandPalette.ai.unreachable'));
				return;
			default: {
				const _exhaustive: never = outcome;
				return _exhaustive;
			}
		}
	});
	useEffect(() => useSpokenRequestStore.subscribe((state) => {
		if (!state.pending) return;
		const text = useSpokenRequestStore.getState().take();
		if (text) void handle(text);
	}), []);
}
