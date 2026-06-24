import { readableTextColor } from '../utils/methodColor';

type Props = {
  color?: string;
  index?: number;
};

/**
 * Small color-coded badge shown on a node only when the same connector+method
 * is used more than once, so the otherwise-identical instances can be told
 * apart. The color matches the reference pills that point at this method.
 */
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
