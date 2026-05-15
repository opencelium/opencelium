import { X } from 'lucide-react';
import { HistoryConfirmDialog } from './HistoryConfirmDialog';
import { HistoryTimelineRow } from './HistoryTimelineRow';
import { useHistoryPanelState } from './useHistoryPanelState';

type Props = { open: boolean; onClose: () => void };

export function HistoryPanel({ open, onClose }: Props) {
	const state = useHistoryPanelState({ open, onClose });

	const saveComment = (id: string) => {
		state.setItems((current) =>
			current.map((item) =>
				item.id === id ? { ...item, comment: state.comments[id] ?? '' } : item,
			),
		);
	};

	const deleteItem = () => {
		if (!state.confirmId) return;
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
					<div className='drawerTitle'>Connection history</div>
					<button className='iconButton' type='button' onClick={onClose}>
						<X size={16} />
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
										onSelect={state.setSelectedId}
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
