import { readableTextColor } from '../utils/methodColor';

type Props = {
  color?: string;
  index?: number;
};

export function MethodColorBadge({ color, index }: Props) {
  if (!index || !color) return null;
  return (
    <span
      className="methodColorBadge"
      style={{ backgroundColor: color, color: readableTextColor(color) }}
      title={`#${index}`}
    >
      {index}
    </span>
  );
}
