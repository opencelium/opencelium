import { useCallback, useRef, useState } from 'react';
import { useGenerateWorkflowMutation, usePlanWorkflowMutation } from '../api/aiApi';
import {
	AI_PLAN_MAX_LENGTH, AI_PROMPT_MAX_LENGTH, type AiGenerationStage, type AiGenerationState,
} from '../model/aiPanelState';
import type { AiConnectorChoice, AiConnectorPair } from '../utils/aiConnectors.utils';
import { toAiGenerationError } from '../utils/aiGenerationError.utils';
import { hasPlanSteps, planToText } from '../utils/planText.utils';

type Params = {
	choices: AiConnectorChoice[];
	/** Called when the gateway cannot be reached mid-request, so the panel can re-check health. */
	onUnreachable: () => void;
};

type PendingRequest<T> = { abort: () => void; unwrap: () => Promise<T> };

export function useAiWorkflowGeneration({ choices, onUnreachable }: Params) {
	const [planWorkflow] = usePlanWorkflowMutation();
	const [generateWorkflow] = useGenerateWorkflowMutation();
	const [connectors, setConnectors] = useState<AiConnectorPair>({ fromId: null, toId: null });
	const [prompt, setPromptValue] = useState('');
	const [planText, setPlanTextValue] = useState('');
	const [state, setState] = useState<AiGenerationState>({ status: 'idle' });
	const pending = useRef<{ abort: () => void } | null>(null);

	const invokerOf = (connectorId: number | null) =>
		choices.find((choice) => choice.connectorId === connectorId)?.invokerName;
	const fromInvoker = invokerOf(connectors.fromId);
	const trimmedPrompt = prompt.trim();
	const isBusy = state.status === 'planning' || state.status === 'generating';
	const canPlan = !isBusy && Boolean(fromInvoker) && trimmedPrompt !== '';
	const canBuild = !isBusy && Boolean(fromInvoker) && trimmedPrompt !== '' && hasPlanSteps(planText);

	const setPrompt = useCallback((value: string) => setPromptValue(value.slice(0, AI_PROMPT_MAX_LENGTH)), []);
	const setPlanText = useCallback((value: string) => setPlanTextValue(value.slice(0, AI_PLAN_MAX_LENGTH)), []);

	/** Runs one gateway request; `onAbort` is where Cancel leads (one stage back). */
	const run = async <T>(stage: AiGenerationStage, request: PendingRequest<T>, onDone: (value: T) => void,
		onAbort: AiGenerationState) => {
		pending.current = request;
		setState({ status: stage === 'plan' ? 'planning' : 'generating', startedAt: Date.now() });
		try {
			onDone(await request.unwrap());
		} catch (error) {
			const failure = toAiGenerationError(error);
			if (failure.failure === 'aborted') {
				setState(onAbort);
				return;
			}
			if (failure.failure === 'unreachable') onUnreachable();
			setState({ status: 'error', stage, ...failure });
		} finally {
			if (pending.current === request) pending.current = null;
		}
	};

	const target = () => ({ prompt: trimmedPrompt, from: fromInvoker ?? '', to: invokerOf(connectors.toId) });

	const plan = async () => {
		if (!canPlan) return;
		await run('plan', planWorkflow(target()), (response) => {
			setPlanTextValue(planToText(response.steps));
			setState({ status: 'plan', pattern: response.pattern });
		}, { status: 'idle' });
	};

	const build = async () => {
		if (!canBuild) return;
		const pattern = state.status === 'plan' ? state.pattern : 'custom';
		await run('build', generateWorkflow({ ...target(), plan: planText }), (response) => {
			setState({ status: 'result', prompt: trimmedPrompt, response });
		}, { status: 'plan', pattern });
	};

	const retry = () => {
		if (state.status !== 'error') return;
		void (state.stage === 'plan' ? plan() : build());
	};

	const cancel = () => pending.current?.abort();
	const backToPrompt = () => setState({ status: 'idle' });
	const backToPlan = () => setState({ status: 'plan', pattern: 'custom' });
	const discard = () => {
		setPromptValue('');
		setPlanTextValue('');
		setState({ status: 'idle' });
	};

	return {
		connectors, setConnectors, prompt, setPrompt, planText, setPlanText, state, canPlan, canBuild,
		plan, build, retry, cancel, backToPrompt, backToPlan, discard,
	};
}

export type AiWorkflowGeneration = ReturnType<typeof useAiWorkflowGeneration>;
