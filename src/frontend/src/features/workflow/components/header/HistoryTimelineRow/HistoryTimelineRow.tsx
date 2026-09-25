import { HistoryDateRow } from '../HistoryDateRow/HistoryDateRow';
import { HistoryEntryRow } from '../HistoryEntryRow/HistoryEntryRow';
import type { HistoryTimelineRowProps } from './HistoryTimelineRow.types';

export function HistoryTimelineRow({
	row,
	selectedId,
	activeId,
	downloadingSnapshotId,
	hoveredCommentId,
	expandedCommentId,
	commentValue,
	expandedWidth,
	expandedShiftLeft,
	menuOpen,
	menuRef,
	onSelect,
	onHover,
	onToggleExpand,
	onFocus,
	onBlur,
	onChangeComment,
	onSave,
	onToggleMenu,
	onCopySnapshot,
	onDownloadTemplate,
	onDelete,
	setCommentRef,
}: HistoryTimelineRowProps) {
	if (row.kind === 'date') return <HistoryDateRow label={row.label} />;
	return (
		<HistoryEntryRow
			activeId={activeId}
			commentValue={commentValue}
			downloadingSnapshotId={downloadingSnapshotId}
			expandedCommentId={expandedCommentId}
			expandedShiftLeft={expandedShiftLeft}
			expandedWidth={expandedWidth}
			hoveredCommentId={hoveredCommentId}
			item={row.item}
			menuOpen={menuOpen}
			menuRef={menuRef}
			selectedId={selectedId}
			onBlur={onBlur}
			onChangeComment={onChangeComment}
			onCopySnapshot={onCopySnapshot}
			onDelete={onDelete}
			onDownloadTemplate={onDownloadTemplate}
			onFocus={onFocus}
			onHover={onHover}
			onSave={onSave}
			onSelect={onSelect}
			onToggleExpand={onToggleExpand}
			onToggleMenu={onToggleMenu}
			setCommentRef={setCommentRef}
		/>
	);
}
