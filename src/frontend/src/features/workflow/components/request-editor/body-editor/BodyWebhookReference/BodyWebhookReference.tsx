import { ReferenceChip } from '../../../reference-chip/ReferenceChip';
import { WEBHOOK_CHIP_COLOR } from '../../../reference-chip/referenceChip.utils';
import { useReferenceSourceLabels } from '../../../reference-chip/ReferenceSourceContext';
import { parseWebhookValue, webhookSnippet } from '../bodyWebhook';
import { BodyReferenceMenu } from '../BodyReferenceMenu/BodyReferenceMenu';
import type { BodyWebhookReferenceProps } from './BodyWebhookReference.types';
import '../bodyLegacy.css';

export function BodyWebhookReference({ webhook, onRemove, onEdit, connection, currentMethod }: BodyWebhookReferenceProps) {
  const parsed = parseWebhookValue(webhook);
  const labels = useReferenceSourceLabels();

  if (!webhook) return null;

  return (
    <span className='bodyLegacyWebhookWrap'>
      <BodyReferenceMenu value={webhookSnippet(webhook)} connection={connection} currentMethod={currentMethod}
        onEdit={onEdit ? (reference) => onEdit(webhook, reference) : undefined}
        onRemove={onRemove ? () => onRemove(webhook) : undefined}>
        <ReferenceChip color={WEBHOOK_CHIP_COLOR} source={labels.webhook} path={parsed.name} title={parsed.label}
          isClickable testId='webhook-reference-chip' />
      </BodyReferenceMenu>
    </span>
  );
}
