import { DeleteOutlined } from '@ant-design/icons';
import type { MouseEvent } from 'react';
import { useMemo, useState } from 'react';
import { parseEnhancementArg } from '../utils/parseEnhancementArg';

type Props = {
  pointer: string;
  pointers: string[];
  submitEdit?: () => void;
  onClick?: (event?: unknown) => void;
  onRemove?: (pointer: string, pointers: string[]) => void;
};

export function BodyPointer({ pointer, pointers, onClick, onRemove }: Props) {
  const [hovered, setHovered] = useState(false);
  const parsed = useMemo(() => parseEnhancementArg(pointer), [pointer]);
  const color = parsed?.color || 'var(--color-text-disabled)';
  const title = parsed
    ? parsed.path
      ? `${parsed.messageProperty}.$.${parsed.path}`
      : `${parsed.messageProperty}.$`
    : pointer;

  const remove = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onRemove?.(pointer, pointers);
  };

  return (
    <div
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        float: 'left',
        margin: '7px 2px',
        width: 20,
        height: 10,
        background: color,
        cursor: 'pointer',
      }}
    >
      {hovered ? (
        <button
          type='button'
          onClick={remove}
          style={{
            position: 'absolute',
            right: -5,
            top: -12,
            border: 0,
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <DeleteOutlined style={{ fontSize: 10, color: 'var(--color-text-primary)' }} />
        </button>
      ) : null}
    </div>
  );
}
