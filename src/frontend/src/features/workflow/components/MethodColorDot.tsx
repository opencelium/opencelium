import { readableTextColor } from '../utils/methodColor';

type Props = {
  color?: string;
  index?: number;
  size?: number;
};

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
