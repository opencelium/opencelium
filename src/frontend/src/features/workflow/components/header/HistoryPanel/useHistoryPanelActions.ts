import { useState } from 'react';
import { message } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import type { HistoryPanelProps } from './HistoryPanel.types';
import type { useHistoryPanelState } from './useHistoryPanelState';
import { notifyError } from '@shared/ui/feedback/notifyError';

type State = ReturnType<typeof useHistoryPanelState>;

export const useHistoryPanelActions = (state: State, props: Pick<HistoryPanelProps,
	'onDeleteVersion' | 'onDownloadTemplate' | 'onSelectVersion' | 'onSaveComment'
	| 'hasUnsavedChanges'>) => {
	const { t: tEntities } = useI18n('entities');
	const { t } = useI18n('workflow');
	const confirm = useConfirm();
	const [downloadingSnapshotId, setDownloadingSnapshotId] = useState<string | null>(null);
	const saveComment = async (id: string) => {
		const item = state.items.find((current) => current.id === id);
		try {
			if (item) await props.onSaveComment?.(item.snapshotId, state.comments[id] ?? '');
			state.setItems((items) => items.map((current) => current.id === id
				? { ...current, comment: state.comments[id] ?? '' } : current));
			state.setActiveId((current) => current === id ? null : current);
			state.setExpandedCommentId((current) => current === id ? null : current);
			(document.activeElement as HTMLElement | null)?.blur?.();
			message.success(t('history.commentSaved'));
		} catch {
			notifyError(t('history.commentSaveFailed'));
		}
	};
	const requestDelete = async (id: string) => {
		const item = state.items.find((current) => current.id === id);
		if (!item) return state.setMenuId(null);
		if (item.current) {
			message.warning(tEntities('connection.messages.history.activeDeleteBlocked'));
			return state.setMenuId(null);
		}
		const ok = await confirm({
			title: t('history.deleteVersion.title'),
			message: t('history.deleteVersion.message'),
			confirmText: t('history.deleteVersion.confirm'),
			cancelText: t('actions.cancel'),
			onConfirm: async () => {
				const nextItems = state.items.filter((current) => current.id !== item.id);
				await props.onDeleteVersion?.(item.snapshotId);
				state.setItems(nextItems);
				if (item.id === state.selectedId) {
					const current = nextItems.find((version) => version.current) ?? nextItems[0];
					state.setSelectedId(current?.id ?? null);
					if (current) await props.onSelectVersion?.(current.snapshotId);
				}
			},
		});
		if (!ok) return;
		state.setMenuId(null);
		message.success(t('messages.deleteVersionSuccess'));
	};
	const toggleExpandedComment = (id: string) => {
		state.setActiveId(id);
		if (state.expandedCommentId === id) {
			state.setExpandedCommentId(null);
			state.setActiveId((current) => current === id ? null : current);
			return;
		}
		state.computeExpandedWidth(id);
		state.setExpandedCommentId(id);
	};
	const applySelectedVersion = async (id: string) => {
		state.setSelectedId(id);
		const item = state.items.find((current) => current.id === id);
		if (item) await props.onSelectVersion?.(item.snapshotId);
	};
	const selectVersion = async (id: string) => {
		if (id === state.selectedId) return;
		if (props.hasUnsavedChanges) {
			await confirm({ title: t('history.unsavedChanges.title'),
				message: tEntities('connection.messages.history.unsavedVersionSwitch'),
				confirmText: t('history.unsavedChanges.confirm'), cancelText: t('actions.cancel'),
				onConfirm: () => applySelectedVersion(id) });
			return;
		}
		await applySelectedVersion(id);
	};
	const downloadTemplate = async (snapshotId: string) => {
		setDownloadingSnapshotId(snapshotId);
		try {
			await props.onDownloadTemplate?.(snapshotId);
			state.setMenuId(null);
		} catch {
			notifyError(t('messages.downloadTemplateFailed'));
		} finally {
			setDownloadingSnapshotId(null);
		}
	};
	return { downloadingSnapshotId, saveComment, requestDelete,
		toggleExpandedComment, selectVersion, downloadTemplate };
};
