import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { readableTextColor } from '../../utils/methodColor';
import type { MethodColorBadgeProps } from './MethodColorBadge.types';

export function MethodColorBadge({ color, index, suppressTooltip }: MethodColorBadgeProps) {
	const { t } = useI18n('workflow');
	if (!index || !color) return null;

	// The positioned badge span must wrap `Tooltip`, not the other way round — see
	// AggregatorBadge for the full explanation of why passing an absolutely-positioned
	// span as Tooltip's children drags the tooltip's anchor to the node's center.
	return (
		<span className='methodColorBadge' style={{ backgroundColor: color, color: readableTextColor(color) }}>
			{suppressTooltip ? index : (
				<Tooltip content={t('node.methodColorBadge')} placement='top'>
					<span>{index}</span>
				</Tooltip>
			)}
		</span>
	);
}
