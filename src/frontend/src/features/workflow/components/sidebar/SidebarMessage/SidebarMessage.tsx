import type { SidebarMessageProps } from './SidebarMessage.types';

export function SidebarMessage({ title, description }: SidebarMessageProps) {
	return (
		<button className='sidebarItem sidebarItemMuted' type='button' disabled>
			<strong>{title}</strong>
			<span>{description}</span>
		</button>
	);
}
