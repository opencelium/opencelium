import type { RefObject } from 'react';
import type { HistoryVersionItem } from '../HistoryPanel/historyPanel.data';

export type HistoryEntryRowProps = {
	activeId: string | null;
	commentValue: string;
	downloadingSnapshotId: string | null;
	expandedCommentId: string | null;
	expandedShiftLeft: number;
	expandedWidth: number;
	hoveredCommentId: string | null;
	item: HistoryVersionItem;
	menuOpen: boolean;
	menuRef: RefObject<HTMLDivElement | null>;
	selectedId: string | null;
	onBlur: (id: string) => void;
	onChangeComment: (id: string, value: string) => void;
	onCopySnapshot: (snapshotId: string) => void;
	onDelete: (id: string) => void;
	onDownloadTemplate: (snapshotId: string) => void;
	onFocus: (id: string) => void;
	onHover: (id: string | null) => void;
	onSave: (id: string) => void;
	onSelect: (id: string) => void;
	onToggleExpand: (id: string) => void;
	onToggleMenu: (id: string) => void;
	setCommentRef: (id: string, element: HTMLDivElement | null) => void;
};
