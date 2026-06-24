import { useState } from 'react';
import { message } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { copyToClipboard } from '@shared/utils/copyToClipboard';
import { HistoryTimelineRow } from './HistoryTimelineRow';
import { useHistoryPanelState } from './useHistoryPanelState';
import type { HistoryVersionItem } from '../../types/history.types';

type Props = {
	open: boolean;
	items?: HistoryVersionItem[];
	onClose: () => void;
	onDeleteVersion?: (snapshotId: string) => Promise<void> | void;
	onDownloadTemplate?: (snapshotId: string) => Promise<void> | void;
	onSelectVersion?: (snapshotId: string) => Promise<void> | void;
	onSaveComment?: (snapshotId: string, comment: string) => Promise<void> | void;
	hasUnsavedChanges?: boolean;
	selectedId?: string | null;
	onSelectedIdChange?: (id: string | null) => void;
};

export function HistoryPanel({ open, items, onClose, onDeleteVersion, onDownloadTemplate, onSelectVersion, onSaveComment, hasUnsavedChanges = false, selectedId, onSelectedIdChange }: Props) {
	const state = useHistoryPanelState({ open, items, onClose, selectedId, onSelectedIdChange });
	const { t: tEntities } = useI18n('entities');
	const { t } = useI18n('workflow');
	const confirm = useConfirm();
	const [downloadingSnapshotId, setDownloadingSnapshotId] = useState<string | null>(null);

	const saveComment = async (id: string) => {
		const item = state.items.find((current) => current.id === id);
		try {
			if (item) await onSaveComment?.(item.snapshotId, state.comments[id] ?? '');
			state.setItems((current) =>
				current.map((item) =>
					item.id === id ? { ...item, comment: state.comments[id] ?? '' } : item,
				),
			);
			state.setActiveId((current) => (current === id ? null : current));
			state.setExpandedCommentId((current) => (current === id ? null : current));
			(document.activeElement as HTMLElement | null)?.blur?.();
			message.success(t('history.commentSaved'));
		} catch {
			message.error(t('history.commentSaveFailed'));
		}
	};

	const requestDelete = async (id: string) => {
		const item = state.items.find((current) => current.id === id);
		if (!item) {
			state.setMenuId(null);
			return;
		}
		if (item.current) {
			message.warning(tEntities('connection.messages.history.activeDeleteBlocked'));
			state.setMenuId(null);
			return;
		}
		const ok = await confirm({
			title: t('history.deleteVersion.title'),
			message: t('history.deleteVersion.message'),
			confirmText: t('history.deleteVersion.confirm'),
			cancelText: t('actions.cancel'),
			onConfirm: async () => {
				const wasSelected = item.id === state.selectedId;
				const nextItems = state.items.filter((current) => current.id !== item.id);
				await onDeleteVersion?.(item.snapshotId);
				state.setItems(nextItems);
				if (wasSelected) {
					const currentVersion = nextItems.find((current) => current.current) ?? nextItems[0];
					state.setSelectedId(currentVersion?.id ?? null);
					if (currentVersion) await onSelectVersion?.(currentVersion.snapshotId);
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
			state.setActiveId((current) => (current === id ? null : current));
			return;
		}
		state.computeExpandedWidth(id);
		state.setExpandedCommentId(id);
	};

	const applySelectedVersion = async (id: string) => {
		state.setSelectedId(id);
		const item = state.items.find((current) => current.id === id);
		if (item) await onSelectVersion?.(item.snapshotId);
	};

	const selectVersion = async (id: string) => {
		if (id === state.selectedId) return;
		if (hasUnsavedChanges) {
			// The version load runs inside onConfirm, so the confirm button shows
			// its progress; nothing left to do once the dialog settles.
			await confirm({
				title: t('history.unsavedChanges.title'),
				message: tEntities('connection.messages.history.unsavedVersionSwitch'),
				confirmText: t('history.unsavedChanges.confirm'),
				cancelText: t('actions.cancel'),
				onConfirm: () => applySelectedVersion(id),
			});
			return;
		}
		await applySelectedVersion(id);
	};

	const downloadTemplate = async (snapshotId: string) => {
		setDownloadingSnapshotId(snapshotId);
		try {
			await onDownloadTemplate?.(snapshotId);
			state.setMenuId(null);
		} catch {
			message.error(t('messages.downloadTemplateFailed'));
		} finally {
			setDownloadingSnapshotId(null);
		}
	};

	return (
		<>
			<div
				className={`drawerOverlay ${open ? 'drawerOverlayOpen' : ''}`}
				onClick={onClose}
			/>
			<aside
				ref={state.panelRef}
				data-testid="workflow-history-panel"
					className={`rightDrawer historyPanelDrawer ${open ? 'rightDrawerOpen' : ''}`}
			>
				<div className='drawerHeader'>
					<div className='drawerTitle'>{t('history.title')}</div>
					<button className='iconButton' type='button' onClick={onClose}>
						<CloseOutlined />
					</button>
				</div>
				<div className='drawerBody historyBody'>
					<div className='historyScroll'>
						{state.rows.length ? (
							<div className='historyTimeline'>
								<div className='historyTimelineLine' />
								{state.rows.map((row) => (
									<HistoryTimelineRow
										key={row.key}
										row={row}
										selectedId={state.selectedId}
										activeId={state.activeId}
										downloadingSnapshotId={downloadingSnapshotId}
										hoveredCommentId={state.hoveredCommentId}
										expandedCommentId={state.expandedCommentId}
										commentValue={
											row.kind === 'item' ? (state.comments[row.item.id] ?? '') : ''
										}
										expandedWidth={
											row.kind === 'item'
												? (state.expandedMetrics[row.item.id]?.width ?? 320)
												: 320
										}
										expandedShiftLeft={
											row.kind === 'item'
												? (state.expandedMetrics[row.item.id]?.shiftLeft ?? 0)
												: 0
										}
										menuOpen={row.kind === 'item' && state.menuId === row.item.id}
										menuRef={state.menuRef}
										onSelect={selectVersion}
										onHover={state.setHoveredCommentId}
										onToggleExpand={toggleExpandedComment}
										onFocus={state.setActiveId}
										onBlur={(id) =>
											state.setActiveId((current) =>
												current === id && state.expandedCommentId !== id
													? null
													: current,
											)
										}
										onChangeComment={(id, value) =>
											state.setComments((current) => ({ ...current, [id]: value }))
										}
										onSave={saveComment}
										onToggleMenu={(id) =>
											state.setMenuId((current) => (current === id ? null : id))
										}
										onCopySnapshot={async (snapshotId) => {
											const copied = await copyToClipboard(snapshotId);
											state.setMenuId(null);
											if (copied) message.success(t('messages.copySnapshotIdSuccess'));
										}}
										onDownloadTemplate={downloadTemplate}
										onDelete={requestDelete}
										setCommentRef={(id, element) => {
											state.commentRefs.current[id] = element;
										}}
									/>
								))}
							</div>
						) : null}
					</div>
				</div>
			</aside>
		</>
	);
}
