import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { message } from 'antd';
import type { Viewport } from '@xyflow/react';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { WorkflowConnectionState } from '../api/connectionMapper';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { WorkflowTemplate } from '../types/workflowTemplate.types';
import { isHeaderNameEmpty, toDisplayDescription } from '../utils/workflowPage.utils';

type HeaderState = { title: string; description: string };

type Params = {
	headerTitle: string;
	setHeaderState: Dispatch<SetStateAction<HeaderState>>;
	setFieldBindings: (bindings: any[] | undefined) => void;
	setWorkflowGraph: (nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[],
		viewport?: Viewport, options?: { centerStart?: boolean }) => void;
	closeDialog: () => void;
	clearSelection: () => void;
};

export const useFinishApplyTemplate = ({ headerTitle, setHeaderState,
	setFieldBindings, setWorkflowGraph, closeDialog, clearSelection }: Params) => {
	const confirm = useConfirm();
	const { t } = useI18n('workflow');

	return useCallback(async (state: WorkflowConnectionState,
		template: WorkflowTemplate) => {
		setWorkflowGraph(state.nodes, state.edges, state.viewport, { centerStart: true });
		setFieldBindings(state.fieldBindings);
		const templateName = template.name?.trim();
		const templateDescription = template.description?.trim();
		const applyMetadata = () => setHeaderState((current) => ({
			title: templateName || current.title,
			description: templateDescription
				? toDisplayDescription(templateDescription) : current.description,
		}));

		if (isHeaderNameEmpty(headerTitle)) {
			applyMetadata();
		} else {
			const replace = await confirm({
				title: t('template.replaceConfirm.title'),
				message: t('template.replaceConfirm.message'),
				confirmText: t('template.replaceConfirm.replace'),
				cancelText: t('template.replaceConfirm.keep'),
			});
			if (replace) applyMetadata();
		}
		closeDialog();
		clearSelection();
		message.success(`Template "${template.name ?? template.templateId}" loaded`);
	}, [headerTitle, setHeaderState, setFieldBindings, setWorkflowGraph,
		closeDialog, clearSelection, confirm, t]);
};
