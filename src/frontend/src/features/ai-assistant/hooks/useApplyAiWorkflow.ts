import { useCallback } from 'react';
import { message } from 'antd';
import type { Viewport } from '@xyflow/react';
import type { Connector } from '@entities/connector/model/types';
import { mapConnectionToWorkflowState } from '@features/workflow/api/connectionMapper';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '@features/workflow/types/workflow.types';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { notifyError } from '@shared/ui/feedback/notifyError';
import type { WorkflowDsl } from '../model/workflowDsl.schema';
import type { AiConnectorPair } from '../utils/aiConnectors.utils';
import { dslToConnection } from '../utils/dslToConnection';

export type AiWorkflowApplyTarget = {
	nodes: WorkflowNodeModel[];
	connectors: Connector[];
	setWorkflowGraph: (nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[],
		viewport?: Viewport, options?: { centerStart?: boolean; isUndoable?: boolean }) => void;
	setFieldBindings: (bindings: unknown[] | undefined) => void;
	markDirty: () => void;
};

/** Replaces the canvas with a generated workflow; resolves false when the user keeps the current one or it fails. */
export function useApplyAiWorkflow({ nodes, connectors, setWorkflowGraph, setFieldBindings, markDirty }: AiWorkflowApplyTarget) {
	const { t } = useI18n('workflow');
	const confirm = useConfirm();
	const hasSteps = nodes.some((node) => node.type !== 'start');

	return useCallback(async (dsl: WorkflowDsl, pair: AiConnectorPair): Promise<boolean> => {
		if (hasSteps) {
			const shouldReplace = await confirm({
				title: t('ai.apply.replaceTitle'),
				message: t('ai.apply.replaceMessage'),
				confirmText: t('ai.apply.replace'),
				cancelText: t('ai.actions.cancel'),
			});
			if (!shouldReplace) return false;
		}
		const byId = (connectorId: number | null) => connectors.find((connector) => connector.connectorId === connectorId) ?? null;
		try {
			const state = mapConnectionToWorkflowState(dslToConnection(dsl, { from: byId(pair.fromId), to: byId(pair.toId) }));
			setWorkflowGraph(state.nodes, state.edges, undefined, { centerStart: true, isUndoable: true });
			// The generated transformations replace the old graph's, which pointed at nodes that are gone.
			setFieldBindings(state.fieldBindings);
			markDirty();
			message.success(t('ai.apply.success'));
			return true;
		} catch {
			notifyError(t('ai.apply.failed'));
			return false;
		}
	}, [hasSteps, confirm, t, connectors, setWorkflowGraph, setFieldBindings, markDirty]);
}
