import { useCallback, useRef, useState } from 'react';
import { useGenerateWorkflowMutation } from '../api/aiApi';
import { AI_PROMPT_MAX_LENGTH, type AiGenerationState } from '../model/aiPanelState';
import type { AiConnectorChoice, AiConnectorPair } from '../utils/aiConnectors.utils';
import { toAiGenerationError } from '../utils/aiGenerationError.utils';

type Params = {
	choices: AiConnectorChoice[];
	/** Called when the gateway cannot be reached mid-generation, so the panel can re-check health. */
	onUnreachable: () => void;
};

type PendingRequest = { abort: () => void };

export function useAiWorkflowGeneration({ choices, onUnreachable }: Params) {
	const [generateWorkflow] = useGenerateWorkflowMutation();
	const [connectors, setConnectors] = useState<AiConnectorPair>({ fromId: null, toId: null });
	const [prompt, setPromptValue] = useState('');
	const [state, setState] = useState<AiGenerationState>({ status: 'idle' });
	const pending = useRef<PendingRequest | null>(null);

	const invokerOf = (connectorId: number | null) =>
		choices.find((choice) => choice.connectorId === connectorId)?.invokerName;
	const fromInvoker = invokerOf(connectors.fromId);
	const trimmedPrompt = prompt.trim();
	const canGenerate = state.status !== 'generating' && Boolean(fromInvoker) && trimmedPrompt !== '';

	const setPrompt = useCallback((value: string) => setPromptValue(value.slice(0, AI_PROMPT_MAX_LENGTH)), []);

	const generate = async () => {
		if (!canGenerate || !fromInvoker) return;
		const request = generateWorkflow({ prompt: trimmedPrompt, from: fromInvoker, to: invokerOf(connectors.toId) });
		pending.current = request;
		setState({ status: 'generating', startedAt: Date.now() });
		try {
			const response = await request.unwrap();
			setState({ status: 'result', prompt: trimmedPrompt, response });
		} catch (error) {
			const failure = toAiGenerationError(error);
			if (failure.failure === 'aborted') {
				setState({ status: 'idle' });
				return;
			}
			if (failure.failure === 'unreachable') onUnreachable();
			setState({ status: 'error', ...failure });
		} finally {
			if (pending.current === request) pending.current = null;
		}
	};

	const cancel = () => pending.current?.abort();
	const backToPrompt = () => setState({ status: 'idle' });
	const discard = () => {
		setPromptValue('');
		setState({ status: 'idle' });
	};

	return {
		connectors, setConnectors, prompt, setPrompt, state, canGenerate,
		generate, cancel, backToPrompt, discard,
	};
}

export type AiWorkflowGeneration = ReturnType<typeof useAiWorkflowGeneration>;
