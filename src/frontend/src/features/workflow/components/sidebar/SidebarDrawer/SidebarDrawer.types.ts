import type { PropsWithChildren } from 'react';

export type SidebarDrawerProps = PropsWithChildren<{
	open: boolean;
	title: string;
	subtitle: string;
	iconUrl?: string | null;
	onClose: () => void;
	shifted?: boolean;
	shiftedFar?: boolean;
	secondary?: boolean;
	tertiary?: boolean;
}>;
