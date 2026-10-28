import { useState } from 'react';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '@features/workflow/types/workflow.types';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { isAiConfigured, useGetAiHealthQuery } from '../../api/aiApi';
import { AiWorkflowExplainDialog } from './AiWorkflowExplainDialog';

type Props = {
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	title: string;
	/** Sets the workflow's description, the way editing it in the header does. */
	onUseDescription: (description: string) => void;
};

/** ✨ beside the workflow description: explains the workflow and proposes a description; hidden without the AI gateway. */
export function AiWorkflowExplainButton({ nodes, edges, title, onUseDescription }: Props) {
	const { t } = useI18n('workflow');
	const isConfigured = isAiConfigured();
	const health = useGetAiHealthQuery(undefined, { skip: !isConfigured });
	const [session, setSession] = useState(0);
	const [isOpen, setIsOpen] = useState(false);
	const hasSteps = nodes.some((node) => Boolean(node.data.methodConfig));
	const isAvailable = isConfigured && health.data?.ollama.reachable === true && health.data.workflowModel.available;
	if (!isAvailable) return null;
	const open = () => {
		setSession((current) => current + 1);
		setIsOpen(true);
	};
	return (
		<>
			<Tooltip content={hasSteps ? t('ai.explain.open') : t('ai.explain.noSteps')}>
				<IconButton type="text" size="xs" iconProps={{ name: 'sparkles', color: 'inherit' }} onClick={open} disabled={!hasSteps}
					testId="workflow-ai-explain" />
			</Tooltip>
			{isOpen && (
				<AiWorkflowExplainDialog key={session} nodes={nodes} edges={edges} title={title}
					onUseDescription={(description) => {
						onUseDescription(description);
						setIsOpen(false);
					}}
					onClose={() => setIsOpen(false)} />
			)}
		</>
	);
}
