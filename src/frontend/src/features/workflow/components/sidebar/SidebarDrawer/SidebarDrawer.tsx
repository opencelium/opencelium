import { X } from 'lucide-react';
import type { SidebarDrawerProps } from './SidebarDrawer.types';

export function SidebarDrawer({
	open,
	title,
	subtitle,
	iconUrl,
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
					{iconUrl ? (
						<div className='drawerHeaderIcon' aria-hidden='true'>
							<img src={iconUrl} alt='' />
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
