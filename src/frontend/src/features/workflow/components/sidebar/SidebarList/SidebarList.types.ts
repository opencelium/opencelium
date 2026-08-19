import type { ConnectorStatus } from '../../../connector-status/ConnectorStatusDot/ConnectorStatusDot.types';

export type SidebarListItem = {
	key: string;
	title: string;
	text: string;
	/** Present on connector-backed items, and then it always renders something: the
	 * connector's icon on a white disc, or the shared default connector image when the
	 * chain (connector → invoker) has none. Items with no artwork omit it — which is
	 * why this is an object rather than a nullable url. */
	connectorArtwork?: { icon: string | null };
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
