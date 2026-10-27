import { useCallback, useMemo, useState } from 'react';
import { isAiConfigured, useGetAiHealthQuery } from '../api/aiApi';
import { type AiApplyBlock, type AiPanelView, toPanelView } from '../model/aiPanelState';
import { type AiConnectorPair, pickDefaultConnectors, toConnectorChoices } from '../utils/aiConnectors.utils';
import { type AiWorkflowApplyTarget, useApplyAiWorkflow } from './useApplyAiWorkflow';
import { useAiWorkflowGeneration } from './useAiWorkflowGeneration';

type Params = {
	target: AiWorkflowApplyTarget;
	/** A running test run locks the graph; generating still works, applying does not. */
	isLocked: boolean;
	/** True while another right-hand drawer is open; the AI panel steps aside for it. */
	isOtherPanelOpen: boolean;
	/** Closes the other drawers before this one opens. */
	onBeforeOpen: () => void;
};

// While the service is down the header button is disabled, so nothing else would notice it coming back.
const UNAVAILABLE_POLL_MS = 15_000;

export function useAiPromptPanel({ target, isLocked, isOtherPanelOpen, onBeforeOpen }: Params) {
	const { nodes, connectors } = target;
	const isConfigured = isAiConfigured();
	const [isAvailable, setIsAvailable] = useState(true);
	const health = useGetAiHealthQuery(undefined, {
		skip: !isConfigured,
		pollingInterval: isAvailable ? 0 : UNAVAILABLE_POLL_MS,
	});
	// Only a settled check changes availability; a re-check in flight keeps the last answer instead of flickering.
	if (!health.isFetching && (health.isSuccess || health.isError)) {
		const isHealthy = !health.isError && health.data?.status === 'ok';
		if (isHealthy !== isAvailable) setIsAvailable(isHealthy);
	}
	const [isOpen, setIsOpen] = useState(false);
	const hasSteps = nodes.some((node) => node.type !== 'start' && node.type !== 'comment');
	// Confirmed health, not the optimistic default: the hint must not flash up before the check fails.
	const isHealthConfirmed = health.data?.status === 'ok' && !health.isError;
	const choices = useMemo(() => toConnectorChoices(connectors), [connectors]);
	const generation = useAiWorkflowGeneration({ choices, onUnreachable: health.refetch });
	const { connectors: selected, setConnectors } = generation;

	const close = useCallback(() => setIsOpen(false), []);
	const applyWorkflow = useApplyAiWorkflow(target);
	const { state } = generation;
	const applyBlock: AiApplyBlock = isLocked ? 'locked'
		: state.status === 'result' && state.response.issues.some((issue) => issue.severity === 'error') ? 'errors' : null;

	const apply = async () => {
		if (state.status !== 'result' || applyBlock) return;
		const isApplied = await applyWorkflow(state.response.dsl, selected);
		if (!isApplied) return;
		generation.backToPrompt();
		close();
	};

	const open = () => {
		onBeforeOpen();
		if (selected.fromId === null && selected.toId === null) setConnectors(pickDefaultConnectors(nodes, choices));
		setIsOpen(true);
		if (isConfigured) void health.refetch();
	};

	/** Opens the panel with a request from outside the editor and starts planning it. */
	const openWith = (request: { prompt: string; connectors: AiConnectorPair }) => {
		onBeforeOpen();
		setIsOpen(true);
		void generation.planRequest(request);
	};

	const [wasOtherPanelOpen, setWasOtherPanelOpen] = useState(isOtherPanelOpen);
	if (isOtherPanelOpen !== wasOtherPanelOpen) {
		setWasOtherPanelOpen(isOtherPanelOpen);
		if (isOtherPanelOpen) setIsOpen(false);
	}

	const view: AiPanelView = !isAvailable && generation.state.status !== 'result'
		? 'unavailable'
		: toPanelView(generation.state);

	return {
		isConfigured,
		openWith,
		button: {
			isOpen,
			isAvailable,
			/** Show the "new feature" card unprompted: a workflow without steps is where the assistant helps most. */
			isIntroOpen: isHealthConfirmed && !isOpen && !isLocked && !hasSteps,
			onToggle: () => (isOpen ? close() : open()),
		},
		panel: {
			isOpen,
			view,
			choices,
			generation,
			isCheckingHealth: health.isFetching,
			onCheckAgain: () => void health.refetch(),
			onClose: close,
			applyBlock,
			onApply: () => void apply(),
		},
	};
}

export type AiPromptPanelModel = ReturnType<typeof useAiPromptPanel>['panel'];
