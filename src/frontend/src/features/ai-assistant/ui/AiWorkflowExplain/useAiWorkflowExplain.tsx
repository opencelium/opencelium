import { useState } from 'react';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '@features/workflow/types/workflow.types';
import { useWorkflowAssistAction } from '@features/workflow/command/workflowAssistBridge';
import { isAiConfigured, useGetAiHealthQuery } from '../../api/aiApi';
import { AiWorkflowExplainDialog } from './AiWorkflowExplainDialog';

export type AiWorkflowExplainParams = {
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	title: string;
	/** Sets the workflow's description, the way editing it in the header does. */
	onUseDescription: (description: string) => void;
};

/** Explains the workflow and proposes a description; `dialog` is rendered by whoever offers `open`. */
export function useAiWorkflowExplain({ nodes, edges, title, onUseDescription }: AiWorkflowExplainParams) {
	const isConfigured = isAiConfigured();
	const health = useGetAiHealthQuery(undefined, { skip: !isConfigured });
	const [session, setSession] = useState(0);
	const [isOpen, setIsOpen] = useState(false);
	const hasSteps = nodes.some((node) => Boolean(node.data.methodConfig));
	const isAvailable = isConfigured && health.data?.ollama.reachable === true && health.data.workflowModel.available;
	const open = () => {
		setSession((current) => current + 1);
		setIsOpen(true);
	};
	useWorkflowAssistAction('explainWorkflow', isAvailable && hasSteps ? open : null);
	const dialog = isOpen ? (
		<AiWorkflowExplainDialog key={session} nodes={nodes} edges={edges} title={title}
			onUseDescription={(description) => {
				onUseDescription(description);
				setIsOpen(false);
			}}
			onClose={() => setIsOpen(false)} />
	) : null;
	return { isAvailable, hasSteps, open, dialog };
}
