import { useState } from 'react';
import { message } from 'antd';
import { apiExecutor } from '@shared/api/apiExecutor';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import {
	pickConnectionTemplateFile,
	uploadConnectionTemplate,
} from '@entities/connectionTemplate/lib/uploadConnectionTemplate';
import type { WorkflowTemplate } from '../types/workflowTemplate.types';
import { notifyError } from '@shared/ui/feedback/notifyError';

export const useLoadConnectionTemplate = () => {
	const confirm = useConfirm();
	const { t } = useI18n('workflow');
	const { t: tEntities } = useI18n('entities');
	const [dialogOpen, setDialogOpen] = useState(false);
	const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
	const [selectedTemplateId, setSelectedTemplateId] = useState<string>();
	const [isLoading, setIsLoading] = useState(false);
	const [isUploading, setIsUploading] = useState(false);

	const fetchTemplates = async () => {
		const response = await apiExecutor({
			url: '/template/all?metadataOnly=true',
			method: 'GET',
		});
		const nextTemplates = Array.isArray(response) ? response : [];
		setTemplates(nextTemplates);
		return nextTemplates;
	};

	const openDialog = async () => {
		setDialogOpen(true);
		setSelectedTemplateId(undefined);
		setIsLoading(true);
		try {
			await fetchTemplates();
		} catch {
			notifyError(t('messages.loadTemplatesFailed'));
		} finally {
			setIsLoading(false);
		}
	};

	const uploadTemplate = async () => {
		const file = await pickConnectionTemplateFile();
		if (!file) return;
		setIsUploading(true);
		try {
			const uploadedId = await uploadConnectionTemplate(file, () => confirm({
				title: tEntities('connection-template.list.upload.confirmReplace.title'),
				message: tEntities('connection-template.list.upload.confirmReplace.message'),
			}));
			if (uploadedId) {
				message.success(tEntities('connection-template.list.upload.success',
					{ name: file.name }));
				await fetchTemplates();
				setSelectedTemplateId(String(uploadedId));
			}
		} catch (error) {
			console.error(error);
			notifyError(tEntities('connection-template.list.upload.error'));
		} finally {
			setIsUploading(false);
		}
	};

	const closeDialog = (isApplying = false) => {
		if (isApplying) return;
		setDialogOpen(false);
		setSelectedTemplateId(undefined);
	};

	return { dialogOpen, setDialogOpen, templates, selectedTemplateId,
		setSelectedTemplateId, isLoading, isUploading, openDialog,
		uploadTemplate, closeDialog };
};
