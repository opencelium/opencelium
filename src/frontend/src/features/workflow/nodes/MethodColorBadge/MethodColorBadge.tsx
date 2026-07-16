import { readableTextColor } from '../../utils/methodColor';
import type { MethodColorBadgeProps } from './MethodColorBadge.types';

export function MethodColorBadge({ color, index }: MethodColorBadgeProps) {
	if (!index || !color) return null;

	return (
		<span
			className='methodColorBadge'
			style={{ backgroundColor: color, color: readableTextColor(color) }}
			title={`#${index}`}
		>
			{index}
		</span>
	);
}
