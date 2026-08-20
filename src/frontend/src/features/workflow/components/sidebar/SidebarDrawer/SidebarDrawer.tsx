import { ConnectorIcon } from '@entities/connector/ui/ConnectorIcon';
import { X } from 'lucide-react';
import type { SidebarDrawerProps } from './SidebarDrawer.types';

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
			<div className='drawerHeader'>
				<div className='drawerHeaderContent'>
					{connectorIcon !== undefined ? (
						<div className='drawerHeaderIcon' aria-hidden='true'>
							<ConnectorIcon icon={connectorIcon} size={HEADER_ICON_SIZE} isCircled />
						</div>
					) : null}
					<div>
						<div className='drawerTitle'>{title}</div>
						<div className='drawerSubTitle'>{subtitle}</div>
					</div>
				</div>
				<button className='iconButton' type='button' onClick={onClose}>
					<X size={16} />
				</button>
			</div>
			<div className='drawerBody'>{children}</div>
		</aside>
	);
}
