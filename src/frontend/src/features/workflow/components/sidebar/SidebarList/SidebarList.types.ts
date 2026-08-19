import type { IconName } from '@shared/ui/primitives/Icon/Icon.types';
import type { ConnectorStatus } from '../../../connector-status/ConnectorStatusDot/ConnectorStatusDot.types';

/**
 * What fills an item's trailing slot. `connector` always renders something — the
 * connector's icon on a white disc, or the shared default connector image when the
 * chain (connector → invoker) has none — so a connector item can't silently lose its
 * artwork the way a nullable url could; items with no artwork at all just omit this.
 */
export type SidebarListArtwork =
	| { kind: 'connector'; icon: string | null }
	| { kind: 'icon'; name: IconName };

export type SidebarListItem = {
	key: string;
	title: string;
	text: string;
	artwork?: SidebarListArtwork;
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
