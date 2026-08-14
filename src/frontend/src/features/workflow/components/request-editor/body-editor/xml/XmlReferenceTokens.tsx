import { CloseOutlined } from '@ant-design/icons';
import { Button, Tag } from 'antd';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { getParsedReferences, splitReferences } from '../bodyReference';
import { useMethodContext } from '../../../../providers/MethodContext';
import type { RootState } from '../../../../store';
import { formatLiveReferenceValue, normalizeParsedReference, useLiveReferenceValue } from '../../utils/useLiveReferenceValue';
import { LiveReferenceValuePreview } from '../../utils/LiveReferenceValuePreview';

type Props = {
  value: string;
  onChange: (next: string) => void;
  onClick?: () => void;
  readOnly?: boolean;
};

const getLabel = (reference: string) => {
  const parsed = getParsedReferences(reference)[0];
  if (!parsed) return reference;
  if (parsed.field === 'status') return 'Response Status';
  if (parsed.field.startsWith('body.')) return `B:${parsed.field.replace(/^body\.\$?\./, '')}`;
  if (parsed.field.startsWith('header.')) return `H:${parsed.field.replace(/^header\.\$?\./, '')}`;
  return parsed.field;
};

// Same reasoning as RequestReferenceTokens.tsx's ReferenceTag: one tag per
// reference (no ambiguity about which reference a value belongs to), but the
// single-vs-multiple split still keys off how many references share the
// whole FIELD, so a value assembled from several sources doesn't get one
// arbitrary source's value stamped over its structural label.
function ReferenceTag({
  reference,
  isOnlyReferenceInField,
  onClick,
  onRemove,
}: {
  reference: string;
  isOnlyReferenceInField: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}) {
  const connection = useSelector((state: RootState) => state.connection.connection);
  const { method } = useMethodContext();
  const [hovered, setHovered] = useState(false);
  const parsed = getParsedReferences(reference)[0];
  const normalized = parsed ? normalizeParsedReference(parsed) : null;
  const { value: liveValue, hasValue, isLoading } = useLiveReferenceValue(normalized, connection, method, hovered);
  const liveText = hasValue ? formatLiveReferenceValue(liveValue) : null;
  const staticLabel = getLabel(reference);
  const showLiveLabel = isOnlyReferenceInField && liveText !== null;
  const tooltipContent = (
    <LiveReferenceValuePreview
      label={staticLabel}
      isLoading={isLoading}
      hasValue={hasValue}
      rawValue={liveValue}
      formattedValue={liveText}
    />
  );

  return (
    <Tooltip content={tooltipContent} maxWidth={320}>
      <Tag
        color={parsed?.color || 'blue'}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          cursor: onClick ? 'pointer' : 'default',
          marginInlineEnd: 0,
          maxWidth: 260,
        }}
        onClick={onClick}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {showLiveLabel ? liveText : staticLabel}
        </span>
        {onRemove ? (
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
            style={{ width: 16, height: 16, minWidth: 16, padding: 0, color: 'inherit' }}
          />
        ) : null}
      </Tag>
    </Tooltip>
  );
}

export function XmlReferenceTokens({ value, onChange, onClick, readOnly }: Props) {
  const confirm = useConfirm();
  const { t: tWorkflow } = useI18n('workflow');
  const refs = splitReferences(value);
  if (!refs.length) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {refs.map((reference, index) => (
        <ReferenceTag
          key={`${reference}-${index}`}
          reference={reference}
          isOnlyReferenceInField={refs.length === 1}
          onClick={onClick}
          onRemove={
            readOnly
              ? undefined
              : async () => {
                  const ok = await confirm({
                    title: tWorkflow('references.confirmDelete.title'),
                    message: tWorkflow('references.confirmDelete.message'),
                  });
                  if (!ok) return;
                  onChange(refs.filter((_, current) => current !== index).join('; '));
                }
          }
        />
      ))}
    </div>
  );
}
