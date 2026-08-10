import { DeleteOutlined } from '@ant-design/icons';
import type { MouseEvent } from 'react';
import { useState } from 'react';
import { parseWebhookValue } from '../bodyWebhook';
import type { BodyWebhookReferenceProps } from './BodyWebhookReference.types';
import '../bodyLegacy.css';

export function BodyWebhookReference({ webhook, onRemove }: BodyWebhookReferenceProps) {
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
