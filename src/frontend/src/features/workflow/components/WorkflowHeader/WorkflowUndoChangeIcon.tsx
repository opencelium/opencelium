import { Icon } from '@shared/ui/primitives/Icon';
import { ConnectorIcon } from '@entities/connector/ui/ConnectorIcon';
import { resolveConnectorIconUrl } from '@entities/connector/model/iconUrl';
import type { WorkflowUndoIcon } from '../../types/undoHistory.types';

type Props = {
	icon?: WorkflowUndoIcon;
	size?: number;
};

/**
 * Glyph identifying the node a history entry concerns. Connectors show their own
 * logo, falling back to the generic connector glyph — the same rule the canvas
 * node and MethodConnectorChip use, so one method reads the same everywhere.
 *
 * Every variant occupies the same box so the labels line up in a column, and
 * rows with no subject node (session start, connection changes) render an empty
 * ring rather than a gap.
 */
export function WorkflowUndoChangeIcon({ icon, size = 14 }: Props) {
	// No subject node — "Session start", and the few entries that concern the graph
	// as a whole. An empty ring keeps the icon column unbroken.
	if (!icon) {
		return <span className='undoHistoryItemIcon undoHistoryItemIcon--empty' aria-hidden />;
	}

	if (icon.kind === 'connector') {
		// Only the real logo gets the white disc: the fallback glyph is themed and
		// would vanish against it.
		return resolveConnectorIconUrl(icon.iconUrl)
			? (
				<span className='undoHistoryItemIcon undoHistoryItemIcon--logo'>
					<ConnectorIcon icon={icon.iconUrl} size={size} style={{ flexShrink: 0 }} />
				</span>
			)
			: <span className='undoHistoryItemIcon'><Icon name='connector' size={size} /></span>;
	}

	return <span className='undoHistoryItemIcon'><Icon name={icon.kind} size={size} /></span>;
}
