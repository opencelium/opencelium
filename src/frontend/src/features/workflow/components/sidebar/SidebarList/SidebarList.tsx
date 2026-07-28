import { buildTestId } from '@shared/testing/testId';
import { ConnectorStatusDot } from '../../../connector-status/ConnectorStatusDot/ConnectorStatusDot';
import type { SidebarListProps } from './SidebarList.types';

export function SidebarList({ items, onSelect, testIdPrefix }: SidebarListProps) {
	return (
		<div className='sidebarList'>
			{items.map((item) => (
				<button
					key={item.key}
					className={`sidebarItem${item.imageUrl ? ' sidebarItemWithImage' : ''}${item.disabled ? ' sidebarItemMuted' : ''}`}
					type='button'
					disabled={item.disabled}
					data-testid={buildTestId(testIdPrefix, 'item', item.key)}
					onClick={() => {
						if (!item.disabled) onSelect(item.key);
					}}
				>
					<strong>{item.title}</strong>
					<span>{item.text}</span>
					{item.statusError ? <span className='sidebarItemError'>{item.statusError}</span> : null}
					{item.status ? (
						<div className='sidebarItemStatus'>
							<ConnectorStatusDot
								status={item.status}
								testId={buildTestId(testIdPrefix, 'status', item.key)}
								tooltipPlacement="topLeft"
							/>
						</div>
					) : null}
					{item.imageUrl ? (
						<div className='sidebarItemImage' aria-hidden='true'>
							<img src={item.imageUrl} alt='' />
						</div>
					) : null}
				</button>
			))}
		</div>
	);
}
