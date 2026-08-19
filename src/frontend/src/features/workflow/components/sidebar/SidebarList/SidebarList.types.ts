import type { IconName } from '@shared/ui/primitives/Icon/Icon.types';
import type { ConnectorStatus } from '../../../connector-status/ConnectorStatusDot/ConnectorStatusDot.types';

export type SidebarListItem = {
	key: string;
	title: string;
	text: string;
	imageUrl?: string | null;
	/** Shown in the same trailing slot as `imageUrl`, for items with no artwork
	 * of their own (the Comment palette entry). */
	icon?: IconName;
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
