import type { RefObject } from 'react';
import type { HistoryVersionItem } from './historyPanel.data';
import { HistoryDateRow } from './HistoryDateRow';
import { HistoryEntryRow } from './HistoryEntryRow';

type HistoryRow =
	| { kind: 'date'; key: string; label: string }
	| { kind: 'item'; key: string; item: HistoryVersionItem };

type Props = {
	row: HistoryRow;
	selectedId: string | null;
	activeId: string | null;
	hoveredCommentId: string | null;
	expandedCommentId: string | null;
	commentValue: string;
	expandedWidth: number;
	expandedShiftLeft: number;
	menuOpen: boolean;
	menuRef: RefObject<HTMLDivElement | null>;
	onSelect: (id: string) => void;
	onHover: (id: string | null) => void;
	onToggleExpand: (id: string) => void;
	onFocus: (id: string) => void;
	onBlur: (id: string) => void;
	onChangeComment: (id: string, value: string) => void;
	onSave: (id: string) => void;
	onToggleMenu: (id: string) => void;
	onCopySnapshot: (snapshotId: string) => void;
	onDownloadTemplate: (snapshotId: string) => void;
	onDelete: (id: string) => void;
	setCommentRef: (id: string, element: HTMLDivElement | null) => void;
};

export function HistoryTimelineRow({
	row,
	selectedId,
	activeId,
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
}: Props) {
	if (row.kind === 'date') return <HistoryDateRow label={row.label} />;
	return (
		<HistoryEntryRow
			activeId={activeId}
			commentValue={commentValue}
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
