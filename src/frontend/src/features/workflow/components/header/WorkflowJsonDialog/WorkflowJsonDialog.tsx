import { useCallback } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useGetCategoriesQuery } from '@entities/category/api/categoryApi';
import { useGetDataAggregatorsQuery } from '@entities/dataAggregator/api/dataAggregatorApi';
import { useFetchEntitiesQuery } from '@shared/api/genericApi';
import { JsonEditorDialog } from '@shared/ui/json-editor/JsonEditorDialog';
import type { JsonEditorValidation } from '@shared/ui/json-editor/JsonEditorDialog.types';
import type { WorkflowJsonDialogProps } from './WorkflowJsonDialog.types';
import { validateWorkflowJson } from './workflowJson.validate';
import type { WorkflowJsonPayload } from './workflowJson.schema';

type ConnectionMeta = { id: number; title: string };

export function WorkflowJsonDialog({ open, readOnly, value, connectors,
	onClose, onApply }: WorkflowJsonDialogProps) {
	const { t } = useI18n('workflow');
	const { data: categories } = useGetCategoriesQuery(undefined, { skip: !open });
	const { data: aggregators } = useGetDataAggregatorsQuery(undefined, { skip: !open });
	const { data: connections, isSuccess: connectionsLoaded } = useFetchEntitiesQuery(
		'/connection/all/meta', { skip: !open },
	);
	const validate = useCallback((draft: Record<string, unknown>): JsonEditorValidation<WorkflowJsonPayload> => {
		const result = validateWorkflowJson(draft, { connectors,
			categoryIds: categories?.map((category) => category.id),
			aggregatorIds: aggregators?.map((aggregator) => aggregator.id),
			connections: Array.isArray(connections) ? connections as ConnectionMeta[] : undefined,
			connectionsLoaded });
		if (result.success) return result;
		return { success: false, errors: result.errors.map((item) => ({ path: item.path,
			message: t(item.key, { path: item.path || '-', reason: item.reason || '-' }) })) };
	}, [connectors, categories, aggregators, connections, connectionsLoaded, t]);

	return (
		<JsonEditorDialog open={open} readOnly={readOnly} title={t('json.title')}
			testId="workflow-json" value={value} validate={validate}
			applyConfirm={{ title: t('json.applyConfirm.title'), message: t('json.applyConfirm.message') }}
			onClose={onClose} onApply={onApply}
			forceApply={{
				confirm: { title: t('json.forceApplyConfirm.title'),
					message: t('json.forceApplyConfirm.message') },
				onApply: (draft) => onApply(draft as WorkflowJsonPayload),
			}} />
	);
}
