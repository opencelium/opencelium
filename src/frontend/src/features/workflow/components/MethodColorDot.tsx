import { readableTextColor } from '../utils/methodColor';

type Props = {
  color?: string;
  /** When set (a duplicate instance), shown inside the dot, matching the canvas node badge. */
  index?: number;
  size?: number;
};

/**
 * Inline color dot for method reference lists. Plain dot for single-use
 * methods; shows the duplicate index inside (like the node badge) when the same
 * connector+method is used more than once.
 */
export function MethodColorDot({ color, index, size = 16 }: Props) {
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
