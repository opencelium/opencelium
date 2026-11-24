import { Icon } from '@shared/ui/primitives/Icon';
import { parseWebhookValue, webhookSnippet } from '../bodyWebhook';
import { BodyReferenceMenu } from '../BodyReferenceMenu/BodyReferenceMenu';
import type { BodyWebhookReferenceProps } from './BodyWebhookReference.types';
import '../bodyLegacy.css';

export function BodyWebhookReference({ webhook, onRemove, onEdit, connection, currentMethod }: BodyWebhookReferenceProps) {
  const parsed = parseWebhookValue(webhook);

  if (!webhook) return null;

  return (
    <span className='bodyLegacyWebhookWrap'>
      <BodyReferenceMenu value={webhookSnippet(webhook)} connection={connection} currentMethod={currentMethod}
        onEdit={onEdit ? (reference) => onEdit(webhook, reference) : undefined}
        onRemove={onRemove ? () => onRemove(webhook) : undefined}>
        <span className='bodyLegacyWebhookBadge' title={parsed.label} data-testid='webhook-reference-chip'>
          <Icon name='webhook' size={12} color='inherit' />
          {parsed.name}
        </span>
      </BodyReferenceMenu>
    </span>
  );
}
