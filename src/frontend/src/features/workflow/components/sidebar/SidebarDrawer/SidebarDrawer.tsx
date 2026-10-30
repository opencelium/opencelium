import { ConnectorIcon } from '@entities/connector/ui/ConnectorIcon';
import type { SidebarDrawerProps } from './SidebarDrawer.types';
import { DrawerHeader } from '@features/workflow/components/sidebar/DrawerHeader/DrawerHeader';

// Matches the 32px .drawerHeaderIcon slot.
const HEADER_ICON_SIZE = 32;

export function SidebarDrawer({
	open,
	title,
	subtitle,
	connectorIcon,
	onClose,
	shifted,
	shiftedFar,
	secondary,
	tertiary,
	children,
}: SidebarDrawerProps) {
	return (
		<aside
			className={`rightDrawer ${open ? 'rightDrawerOpen' : ''} ${shifted ? 'rightDrawerShifted' : ''} ${shiftedFar ? 'rightDrawerShiftedFar' : ''} ${secondary ? 'rightDrawerSecondary' : ''} ${tertiary ? 'rightDrawerTertiary' : ''}`}
		>
			<DrawerHeader
				title={title}
				subtitle={subtitle}
				icon={connectorIcon !== undefined ? <ConnectorIcon icon={connectorIcon} size={HEADER_ICON_SIZE} isCircled /> : undefined}
				onClose={onClose}
				closeTestId='workflow-sidebar-close'
			/>
			<div className='drawerBody'>{children}</div>
		</aside>
	);
}
