import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { readWorkflowFocus, withoutWorkflowFocus } from '@shared/lib/workflowLinks';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { findViolationNodeId } from '../utils/workflowReferenceErrors';
import { runWithoutUnsavedChangesGuard } from './unsavedChangesGuard';

type Params = {
	isLoading: boolean;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	selectNode: (id: string) => void;
};

/** Selects the element a "used by" link points at (`?element=<index>&focusColor=<hex>`), once. */
export function useFocusElementFromUrl({ isLoading, nodes, edges, selectNode }: Params) {
	const route = useLocation();
	const navigate = useNavigate();
	const { t } = useI18n('workflow');

	useEffect(() => {
		if (isLoading) return;
		const focus = readWorkflowFocus(route.search);
		if (!focus) return;
		// Read once: a reload or Back/Forward must not jump again.
		runWithoutUnsavedChangesGuard(() => navigate(
			{ pathname: route.pathname, search: withoutWorkflowFocus(route.search) }, { replace: true }));
		const nodeId = findViolationNodeId(nodes, edges, focus);
		if (nodeId) selectNode(nodeId);
		else message.warning(t('messages.focusElementNotFound'));
		// Only a new URL or the end of loading should trigger it, not every graph edit.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isLoading, route.search]);
}
