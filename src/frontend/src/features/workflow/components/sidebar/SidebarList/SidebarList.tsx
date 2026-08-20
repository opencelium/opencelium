import { ConnectorIcon } from '@entities/connector/ui/ConnectorIcon';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { buildTestId } from '@shared/testing/testId';
import { ConnectorStatusDot } from '../../../connector-status/ConnectorStatusDot/ConnectorStatusDot';
import type { SidebarListProps } from './SidebarList.types';

// Fits inside the 40px .sidebarItemImage slot.
const CONNECTOR_ICON_SIZE = 36;

export function SidebarList({ items, onSelect, testIdPrefix, updateAction }: SidebarListProps) {
	return (
		<div className='sidebarList'>
			{items.map((item) => (
				// The row is a button, so the update affordance can't live inside it —
				// nested buttons are invalid markup. It sits over the row instead.
				<div className='sidebarItemRow' key={item.key}>
				<button
					className={`sidebarItem${item.connectorArtwork ? ' sidebarItemWithImage' : ''}${item.disabled ? ' sidebarItemMuted' : ''}`}
					type='button'
					disabled={item.disabled}
					data-testid={buildTestId(testIdPrefix, 'item', item.key)}
					onClick={() => {
						if (!item.disabled) onSelect(item.key);
					}}
				>
					<strong>{item.title}</strong>
					<span>{item.text}</span>
					{/* The line is clipped to one row, and a backend connection error is
					    routinely longer than that — so the untruncated text is on hover. */}
					{item.statusError ? (
						<Tooltip content={item.statusError} placement='topLeft' maxWidth={320}>
							<span className='sidebarItemError'>{item.statusError}</span>
						</Tooltip>
					) : null}
					{item.status ? (
						<div className='sidebarItemStatus'>
							<ConnectorStatusDot
								status={item.status}
								testId={buildTestId(testIdPrefix, 'status', item.key)}
								tooltipPlacement="topLeft"
								lastCheckedAt={item.lastCheckedAt}
							/>
						</div>
					) : null}
					{item.connectorArtwork ? (
						<div className='sidebarItemImage' aria-hidden='true'>
							<ConnectorIcon icon={item.connectorArtwork.icon}
								size={CONNECTOR_ICON_SIZE} isCircled />
						</div>
					) : null}
				</button>
				{updateAction && item.hasConnectionError ? (
					<div className='sidebarItemUpdate'>
						<Tooltip content={updateAction.tooltip} placement='topLeft'>
							<IconButton
								iconProps={{ name: 'edit', size: 12 }}
								type='text'
								size='xs'
								testId={buildTestId(testIdPrefix, 'update', item.key)}
								onClick={() => updateAction.onUpdate(item.key)}
							/>
						</Tooltip>
					</div>
				) : null}
				</div>
			))}
		</div>
	);
}
