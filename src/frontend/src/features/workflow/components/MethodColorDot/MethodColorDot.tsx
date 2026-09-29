import { readableTextColor, swatchRingColor } from '../../utils/methodColor';
import type { MethodColorDotProps } from './MethodColorDot.types';

export function MethodColorDot({ color, index, size = 16 }: MethodColorDotProps) {
	if (!color) return null;

	return (
		<span
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				width: size,
				height: size,
				borderRadius: '50%',
				backgroundColor: color,
				color: readableTextColor(color),
				// Without it a near-surface colour (the palette still holds greys)
				// reads as no swatch at all rather than as a pale one.
				boxShadow: `inset 0 0 0 1px ${swatchRingColor(color)}`,
				fontSize: 10,
				fontWeight: 700,
				lineHeight: 1,
				flexShrink: 0,
			}}
		>
			{index ?? ''}
		</span>
	);
}
