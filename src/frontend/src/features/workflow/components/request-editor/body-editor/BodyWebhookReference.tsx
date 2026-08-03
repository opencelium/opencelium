import { useState } from 'react';
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { parseWebhookValue } from './bodyWebhook';
import './bodyLegacy.css';

type Props = {
  webhook: string;
  onRemove?: (webhook: string) => void;
};

export function BodyWebhookReference({ webhook, onRemove }: Props) {
  const { t } = useI18n('workflow');
  const [hovered, setHovered] = useState(false);
  const parsed = parseWebhookValue(webhook);

  if (!webhook) return null;

  return (
    <span className='bodyLegacyWebhookWrap' onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <span className='bodyLegacyWebhookBadge' title={parsed.label}>
        {parsed.name}
      </span>
      {hovered ? (
        <span
          className='bodyLegacyWebhookRemove'
          onClick={(event) => event.stopPropagation()}
        >
          <Tooltip content={t('actions.delete')}>
            <DeleteIconButton iconSize={11} onClick={() => onRemove?.(webhook)} />
          </Tooltip>
        </span>
      ) : null}
    </span>
  );
}
