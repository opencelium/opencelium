import { useCallback, useMemo, useState } from 'react';
import type { Connector } from '@entities/connector/model/types';
import type { WorkflowNodeModel } from '@features/workflow/types/workflow.types';
import { isAiConfigured, useGetAiHealthQuery } from '../api/aiApi';
import type { AiPanelView } from '../model/aiPanelState';
import { pickDefaultConnectors, toConnectorChoices } from '../utils/aiConnectors.utils';
import { useAiWorkflowGeneration } from './useAiWorkflowGeneration';

type Params = {
	nodes: WorkflowNodeModel[];
	connectors: Connector[];
	/** True while another right-hand drawer is open; the AI panel steps aside for it. */
	isOtherPanelOpen: boolean;
	/** Closes the other drawers before this one opens. */
	onBeforeOpen: () => void;
};

// While the service is down the header button is disabled, so nothing else would notice it coming back.
const UNAVAILABLE_POLL_MS = 15_000;

export function useAiPromptPanel({ nodes, connectors, isOtherPanelOpen, onBeforeOpen }: Params) {
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
	const choices = useMemo(() => toConnectorChoices(connectors), [connectors]);
	const generation = useAiWorkflowGeneration({ choices, onUnreachable: health.refetch });
	const { connectors: selected, setConnectors } = generation;

	const close = useCallback(() => setIsOpen(false), []);

	const open = () => {
		onBeforeOpen();
		if (selected.fromId === null && selected.toId === null) setConnectors(pickDefaultConnectors(nodes, choices));
		setIsOpen(true);
		if (isConfigured) void health.refetch();
	};

	const [wasOtherPanelOpen, setWasOtherPanelOpen] = useState(isOtherPanelOpen);
	if (isOtherPanelOpen !== wasOtherPanelOpen) {
		setWasOtherPanelOpen(isOtherPanelOpen);
		if (isOtherPanelOpen) setIsOpen(false);
	}

	const view: AiPanelView = !isAvailable && generation.state.status !== 'result'
		? 'unavailable'
		: generation.state.status;

	return {
		isConfigured,
		button: {
			isOpen,
			isAvailable,
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
		},
	};
}

export type AiPromptPanelModel = ReturnType<typeof useAiPromptPanel>['panel'];
