import { useCallback } from 'react';
import { apiExecutor } from '@shared/api/apiExecutor';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { NOT_EXIST_ARG } from '../utils/enhancementArgs';
import { findBrokenEnhancementScripts } from '../utils/graph.brokenScriptValidation';
import { resolveWorkflowApiError } from '../utils/workflowApiErrors';
import { EMPTY_NAME_LABEL } from '../utils/workflowPage.utils';

type Params = {
	persistedTitle: string;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	setNodeError: (nodeId: string, message: string) => void;
	centerOnNode: (nodeId: string) => void;
};

export const useWorkflowValidation = ({ persistedTitle, nodes, edges,
	setNodeError, centerOnNode }: Params) => {
	const { t } = useI18n('workflow');
	const { t: tEntities } = useI18n('entities');

	const validateTitle = useCallback(async (title: string): Promise<string | null> => {
		const trimmed = title.trim();
		if (!trimmed || trimmed === EMPTY_NAME_LABEL || trimmed === persistedTitle) return null;
		const check = await apiExecutor({
			url: `/connection/check?name=${encodeURIComponent(trimmed)}`,
			method: 'GET',
		});
		if (check && typeof check === 'object' && 'message' in check &&
			(check as { message?: string }).message === 'EXISTS') {
			return t('messages.workflowNameExists');
		}
		return null;
	}, [persistedTitle, t]);

	/**
	 * Refuses a save whose enhancement scripts still name an input that is gone.
	 * Every offending method is ringed and the first is panned to, the same
	 * treatment a rejected save gets from the backend — the difference being that
	 * this one is answerable here, before anything is sent.
	 */
	const validateEnhancementScripts = useCallback(
		(fieldBindings?: readonly unknown[]): string | null => {
			const broken = findBrokenEnhancementScripts(nodes, fieldBindings);
			if (broken.length === 0) return null;
			const named = broken.length === 1 ? broken[0].label : null;
			const message = named
				? t('messages.enhancementScriptBrokenIn', { method: named, marker: NOT_EXIST_ARG })
				: t('messages.enhancementScriptBroken',
					{ count: broken.length, marker: NOT_EXIST_ARG });
			broken.forEach((item) => item.nodeId && setNodeError(item.nodeId, message));
			const firstNodeId = broken.find((item) => !!item.nodeId)?.nodeId;
			if (firstNodeId) centerOnNode(firstNodeId);
			return message;
		}, [nodes, setNodeError, centerOnNode, t]);

	const resolveAndHighlightError = useCallback((error: unknown): string | null => {
		const resolution = resolveWorkflowApiError(error, nodes, edges);
		if (!resolution) return null;
		switch (resolution.source) {
			case 'backend':
				return resolution.message;
			case 'translated': {
				const message = tEntities(resolution.messageKey, resolution.messageParams);
				// A red ring the user has to hunt for is no better than none: the
				// flagged node can sit anywhere on the canvas, so pan to it as well.
				if (resolution.nodeId) {
					setNodeError(resolution.nodeId, message);
					centerOnNode(resolution.nodeId);
				}
				return message;
			}
			default: {
				const _exhaustive: never = resolution;
				return _exhaustive;
			}
		}
	}, [nodes, edges, setNodeError, centerOnNode, tEntities]);

	return { validateTitle, validateEnhancementScripts, resolveAndHighlightError };
};
