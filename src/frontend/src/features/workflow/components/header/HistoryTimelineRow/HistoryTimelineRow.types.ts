import type { RefObject } from 'react';
import type { HistoryVersionItem } from '../HistoryPanel/historyPanel.data';

export type HistoryRow =
	| { kind: 'date'; key: string; label: string }
	| { kind: 'item'; key: string; item: HistoryVersionItem };

export type HistoryTimelineRowProps = {
	row: HistoryRow;
	selectedId: string | null;
	activeId: string | null;
	downloadingSnapshotId: string | null;
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
