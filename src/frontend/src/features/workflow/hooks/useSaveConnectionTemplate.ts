import { useState } from 'react';
import { message } from 'antd';
import { store } from '@app/store/store';
import { genericApi } from '@shared/api/genericApi';
import { apiExecutor } from '@shared/api/apiExecutor';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { WorkflowTemplate } from '../types/workflowTemplate.types';
import { buildConnectionPayload } from '../api/connectionPayload';
import { CONNECTION_TEMPLATE_VERSION, triggerJsonDownload } from '../utils/workflowPage.utils';

type Params = {
	connectionId?: string;
	title: string;
	description: string;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings?: any[];
	getViewport: () => { x: number; y: number; zoom: number } | undefined;
};

export const useSaveConnectionTemplate = ({ connectionId, title, description,
	nodes, edges, fieldBindings, getViewport }: Params) => {
	const { t } = useI18n('workflow');
	const { t: tEntities } = useI18n('entities');
	const [dialogOpen, setDialogOpen] = useState(false);
	const [name, setName] = useState('');
	const [templateDescription, setTemplateDescription] = useState('');
	const [nameError, setNameError] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);

	const openDialog = () => {
		setName('');
		setTemplateDescription('');
		setNameError('');
		setDialogOpen(true);
	};

	const closeDialog = () => {
		if (isSaving) return;
		setDialogOpen(false);
		setNameError('');
	};

	const saveTemplate = async () => {
		const trimmedName = name.trim();
		if (!trimmedName) {
			setNameError('Name is required');
			return;
		}
		setIsSaving(true);
		try {
			const connection = buildConnectionPayload({ title, description, nodes, edges,
				viewport: getViewport(), fieldBindings });
			const response = await apiExecutor({ url: '/template', method: 'POST', body: {
				version: CONNECTION_TEMPLATE_VERSION,
				name: trimmedName,
				description: templateDescription,
				connection,
			} });
			if ((response as any)?.status || (response as any)?.error) throw response;
			store.dispatch(genericApi.util.invalidateTags(
				[{ type: 'Entity', id: '/template/all' }] as any));
			setDialogOpen(false);
			message.success(`Template "${trimmedName}" saved`);
		} catch {
			message.error(t('messages.saveTemplateFailed'));
		} finally {
			setIsSaving(false);
		}
	};

	const downloadTemplate = async () => {
		if (!connectionId) return;
		setIsDownloading(true);
		try {
			const template = await apiExecutor({
				url: `/template/connection/${connectionId}`,
				method: 'GET',
			}) as WorkflowTemplate;
			const filename = String(template?.templateId ?? connectionId);
			triggerJsonDownload(filename, template);
			message.success(tEntities('connection.list.downloadTemplate.success',
				{ name: filename }));
		} catch {
			message.error(tEntities('connection.list.downloadTemplate.error'));
		} finally {
			setIsDownloading(false);
		}
	};

	return { dialogOpen, name, setName, description: templateDescription,
		setDescription: setTemplateDescription, nameError, setNameError, isSaving,
		isDownloading, openDialog, closeDialog, saveTemplate, downloadTemplate };
};
