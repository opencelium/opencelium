import type { HistoryVersionItem } from '../../../types/history.types';

export type HistoryPanelProps = {
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
