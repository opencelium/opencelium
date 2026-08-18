import { useState } from 'react';
import { message } from 'antd';
import { apiExecutor } from '@shared/api/apiExecutor';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { Connector } from '@entities/connector/model/types';
import { mapConnectionToWorkflowState, type WorkflowConnectionState } from '../api/connectionMapper';
import { applyConnectorMapping, extractConnectorGroups,
	type ConnectorMappingGroup } from '../components/template/templateConnectorMapping.utils';
import type { WorkflowTemplate } from '../types/workflowTemplate.types';

type PendingApply = { state: WorkflowConnectionState; template: WorkflowTemplate };

type Params = {
	templates: WorkflowTemplate[];
	selectedTemplateId?: string;
	connectors: Connector[];
	finishApply: (state: WorkflowConnectionState, template: WorkflowTemplate) => Promise<void>;
	closeLoadDialog: () => void;
	clearSelection: () => void;
};

export const useApplyConnectionTemplate = ({ templates, selectedTemplateId,
	connectors, finishApply, closeLoadDialog, clearSelection }: Params) => {
	const { t } = useI18n('workflow');
	const [isApplying, setIsApplying] = useState(false);
	const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
	const [mappingGroups, setMappingGroups] = useState<ConnectorMappingGroup[]>([]);
	const [pendingApply, setPendingApply] = useState<PendingApply | null>(null);

	const applySelected = async () => {
		const template = templates.find((item) =>
			String(item.templateId) === selectedTemplateId);
		if (!template) {
			message.error(t('messages.selectTemplate'));
			return;
		}
		setIsApplying(true);
		try {
			const fullTemplate = await apiExecutor({
				url: `/template/${encodeURIComponent(String(template.templateId))}`,
				method: 'GET',
			});
			if (!fullTemplate?.connection) {
				message.error(t('messages.loadTemplateFailed'));
				return;
			}
			const state = mapConnectionToWorkflowState(fullTemplate.connection);
			const groups = extractConnectorGroups(state.nodes);
			if (groups.length) {
				setPendingApply({ state, template });
				setMappingGroups(groups);
				setMappingDialogOpen(true);
				closeLoadDialog();
				return;
			}
			await finishApply(state, template);
		} catch {
			message.error(t('messages.loadTemplateFailed'));
		} finally {
			setIsApplying(false);
		}
	};

	const confirmMapping = async (mapping: Record<number, number>) => {
		if (!pendingApply) return;
		setMappingDialogOpen(false);
		setIsApplying(true);
		try {
			const nodes = applyConnectorMapping(pendingApply.state.nodes, mapping, connectors);
			await finishApply({ ...pendingApply.state, nodes }, pendingApply.template);
		} catch {
			message.error(t('messages.loadTemplateFailed'));
		} finally {
			setIsApplying(false);
			setPendingApply(null);
			setMappingGroups([]);
		}
	};

	const cancelMapping = () => {
		setMappingDialogOpen(false);
		setPendingApply(null);
		setMappingGroups([]);
		clearSelection();
	};

	return { isApplying, mappingDialogOpen, mappingGroups,
		applySelected, confirmMapping, cancelMapping };
};
