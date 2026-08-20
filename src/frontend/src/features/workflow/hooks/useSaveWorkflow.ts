import { useCallback } from 'react';
import { message } from 'antd';
import { store } from '@app/store/store';
import { genericApi } from '@shared/api/genericApi';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { HistoryVersionItem } from '../types/history.types';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { loadConnectionVersions, saveWorkflowConnection } from '../api/connectionService';
import { buildWorkflowChangeSnapshot, EMPTY_NAME_LABEL,
	toDisplayDescription, toPayloadDescription } from '../utils/workflowPage.utils';
import type { WorkflowChangeSource } from './useWorkflowChangeTracking';
import { useDirectReferenceOptimization } from './useDirectReferenceOptimization';
import { notifyError } from '@shared/ui/feedback/notifyError';

type SaveParams = {
	title: string;
	description: string;
	comment: string;
	categoryId?: number | null;
};

type Params = {
	connectionId?: string;
	categoryId: number | null;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings?: any[];
	getViewport: () => { x: number; y: number; zoom: number } | undefined;
	clearNodeErrors: () => void;
	resolveError: (error: unknown) => string | null;
	setFieldBindings: (bindings: any[] | undefined) => void;
	setHeaderState: (state: { title: string; description: string }) => void;
	setPersistedTitle: (title: string) => void;
	setCategoryId: (categoryId: number | null) => void;
	setBaselineSnapshot: (snapshot: string | null) => void;
	setChangeSource: (source: WorkflowChangeSource) => void;
	setHistoryPreviewSnapshot: (snapshot: string | null) => void;
	setHistoryVersions: (versions: HistoryVersionItem[]) => void;
	setSelectedHistoryVersionId: (id: string | null) => void;
	setCreatedConnectionId: (id: string) => void;
};

export const useSaveWorkflow = ({ connectionId, categoryId, nodes, edges,
	fieldBindings, getViewport, clearNodeErrors, resolveError, setFieldBindings,
	setHeaderState, setPersistedTitle, setCategoryId, setBaselineSnapshot,
	setChangeSource, setHistoryPreviewSnapshot, setHistoryVersions,
	setSelectedHistoryVersionId, setCreatedConnectionId }: Params) => {
	const { t } = useI18n('workflow');
	const { t: tEntities } = useI18n('entities');
	const optimizeDirectReferences = useDirectReferenceOptimization({
		fieldBindings, setFieldBindings,
	});

	return useCallback(async ({ title, description, comment,
		categoryId: categoryOverride }: SaveParams) => {
		if (!title.trim() || title.trim() === EMPTY_NAME_LABEL) {
			notifyError(t('messages.enterWorkflowName'));
			throw new Error('Connection name is required');
		}
		clearNodeErrors();
		const normalizedDescription = toPayloadDescription(description);
		const nextCategoryId = categoryOverride !== undefined ? categoryOverride : categoryId;
		const isCreate = !connectionId;
		const bindingsToSave = await optimizeDirectReferences();

		let response;
		try {
			response = await saveWorkflowConnection({ connectionId, title,
				description: normalizedDescription, comment, nodes, edges,
				viewport: getViewport(), fieldBindings: bindingsToSave,
				categoryId: nextCategoryId });
		} catch (error) {
			const specificMessage = resolveError(error);
			notifyError(specificMessage ?? tEntities(isCreate
				? 'connection.messages.saveFailed.create'
				: 'connection.messages.saveFailed.update', { title }));
			throw error;
		}
		const savedId = (response.data as any)?.connectionId;
		const nextConnectionId = connectionId ?? savedId;
		setHeaderState({ title, description: toDisplayDescription(normalizedDescription) });
		setPersistedTitle(title);
		setCategoryId(nextCategoryId);
		setBaselineSnapshot(buildWorkflowChangeSnapshot({
			connectionId: nextConnectionId ? String(nextConnectionId) : connectionId,
			title, description: normalizedDescription, nodes, edges,
			fieldBindings: bindingsToSave,
		}));
		setChangeSource('clean');
		setHistoryPreviewSnapshot(null);
		if (nextConnectionId) {
			const versions = await loadConnectionVersions(nextConnectionId);
			setHistoryVersions(versions);
			setSelectedHistoryVersionId(versions[0]?.id ?? null);
		}
		store.dispatch(genericApi.util.invalidateTags(
			[{ type: 'Entity', id: '/connection/all/meta' }] as any));
		message.success(tEntities(isCreate ? 'connection.messages.saved.create'
			: 'connection.messages.saved.update', { title }));
		if (isCreate && savedId) {
			const id = String(savedId);
			setCreatedConnectionId(id);
			window.history.replaceState(window.history.state, '', `/workflow/update/${id}`);
		}
	}, [connectionId, categoryId, nodes, edges, fieldBindings, getViewport,
		clearNodeErrors, resolveError, setFieldBindings, setHeaderState,
		setPersistedTitle, setCategoryId, setBaselineSnapshot, setChangeSource,
		setHistoryPreviewSnapshot, setHistoryVersions, setSelectedHistoryVersionId,
		setCreatedConnectionId, optimizeDirectReferences, t, tEntities]);
};
