import { DeleteOutlined } from '@ant-design/icons';
import type { MouseEvent } from 'react';
import { useState } from 'react';
import { parseWebhookValue } from './bodyWebhook';
import './bodyLegacy.css';

type Props = {
  webhook: string;
  onRemove?: (webhook: string) => void;
};

export function BodyWebhookReference({ webhook, onRemove }: Props) {
  const [hovered, setHovered] = useState(false);
  const parsed = parseWebhookValue(webhook);

  if (!webhook) return null;

  return (
    <span className='bodyLegacyWebhookWrap' onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <span className='bodyLegacyWebhookBadge' title={parsed.label}>
        {parsed.name}
      </span>
      {hovered ? (
        <button
          type='button'
          className='bodyLegacyWebhookRemove'
          title={parsed.label}
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            event.preventDefault();
            event.stopPropagation();
            onRemove?.(webhook);
          }}
        >
          <DeleteOutlined />
        </button>
      ) : null}
    </span>
  );
}
