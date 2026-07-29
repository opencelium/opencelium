import type { ConnectorStatus } from '../../../connector-status/ConnectorStatusDot/ConnectorStatusDot.types';

export type SidebarListItem = {
	key: string;
	title: string;
	text: string;
	imageUrl?: string | null;
	status?: ConnectorStatus;
	statusError?: string | null;
	lastCheckedAt?: number | null;
	disabled?: boolean;
};

export type SidebarListProps = {
	items: readonly SidebarListItem[];
	onSelect: (key: string) => void;
	testIdPrefix?: string;
};
