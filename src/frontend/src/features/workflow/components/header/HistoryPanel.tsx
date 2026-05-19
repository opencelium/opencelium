import { message } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { HistoryConfirmDialog } from './HistoryConfirmDialog';
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
};

export function HistoryPanel({ open, items, onClose, onDeleteVersion, onDownloadTemplate, onSelectVersion, onSaveComment }: Props) {
	const state = useHistoryPanelState({ open, items, onClose });

	const saveComment = async (id: string) => {
		const item = state.items.find((current) => current.id === id);
		if (item) await onSaveComment?.(item.snapshotId, state.comments[id] ?? '');
		state.setItems((current) =>
			current.map((item) =>
				item.id === id ? { ...item, comment: state.comments[id] ?? '' } : item,
			),
		);
	};

	const deleteItem = async () => {
		if (!state.confirmId) return;
		const item = state.items.find((current) => current.id === state.confirmId);
		if (item?.id === state.selectedId) {
			message.warning('Selected history version cannot be deleted.');
			state.setConfirmId(null);
			state.setMenuId(null);
			return;
		}
		if (item) await onDeleteVersion?.(item.snapshotId);
		state.setItems((current) => current.filter((item) => item.id !== state.confirmId));
		state.setConfirmId(null);
		state.setMenuId(null);
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

	const selectVersion = async (id: string) => {
		state.setSelectedId(id);
		const item = state.items.find((current) => current.id === id);
		if (item) await onSelectVersion?.(item.snapshotId);
	};

	const downloadTemplate = async (snapshotId: string) => {
		try {
			await onDownloadTemplate?.(snapshotId);
			state.setMenuId(null);
		} catch {
			message.error('Failed to download template.');
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
				className={`rightDrawer historyPanelDrawer ${open ? 'rightDrawerOpen' : ''}`}
			>
				<div className='drawerHeader'>
					<div className='drawerTitle'>Version History</div>
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
											await navigator.clipboard.writeText(snapshotId);
											state.setMenuId(null);
										}}
										onDownloadTemplate={downloadTemplate}
										onDelete={state.setConfirmId}
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
			{state.confirmId ? <HistoryConfirmDialog onCancel={() => state.setConfirmId(null)} onDelete={deleteItem} /> : null}
		</>
	);
}
