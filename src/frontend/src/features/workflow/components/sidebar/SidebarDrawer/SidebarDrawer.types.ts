import type { PropsWithChildren } from 'react';

export type SidebarDrawerProps = PropsWithChildren<{
	open: boolean;
	title: string;
	subtitle: string;
	/** Connector icon path (not a resolved url) — rendered by ConnectorIcon, which
	 * applies the same fallback chain and white disc as everywhere else. */
	connectorIcon?: string | null;
	onClose: () => void;
	shifted?: boolean;
	shiftedFar?: boolean;
	secondary?: boolean;
	tertiary?: boolean;
}>;
