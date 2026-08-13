import { CloseOutlined } from '@ant-design/icons';
import { Button, Tag } from 'antd';
import { useSelector } from 'react-redux';
import { getParsedReferences, splitReferences } from '../body-editor/bodyReference';
import { getReferenceDisplayLabel } from './referenceDisplay';
import { useMethodContext } from '../../../providers/MethodContext';
import type { RootState } from '../../../store';
import { formatLiveReferenceValue, normalizeParsedReference, useLiveReferenceValue } from '../utils/useLiveReferenceValue';

type Props = {
  value: string;
  readOnly?: boolean;
  onChange: (next: string) => void;
};

const getLabel = (reference: string) => {
  return getReferenceDisplayLabel(reference);
};

// One tag per reference, so — unlike BodyPointer's field-embedded chips —
// there's never ambiguity about which reference a shown value belongs to.
// The single-vs-multiple split (replace label vs. tooltip) is still driven
// by how many references share this FIELD, for the same reason BodyPointer
// does it that way: a field built from several references reads as "this
// value assembled from N sources", so replacing any one tag's own label
// with just its value would misrepresent the whole.
function ReferenceTag({
  reference,
  isOnlyReferenceInField,
  readOnly,
  onRemove,
}: {
  reference: string;
  isOnlyReferenceInField: boolean;
  readOnly?: boolean;
  onRemove: () => void;
}) {
  const connection = useSelector((state: RootState) => state.connection.connection);
  const { method } = useMethodContext();
  const parsed = getParsedReferences(reference)[0];
  const normalized = parsed ? normalizeParsedReference(parsed) : null;
  const { value: liveValue, hasValue } = useLiveReferenceValue(normalized, connection, method);
  const liveText = hasValue ? formatLiveReferenceValue(liveValue) : null;
  const staticLabel = getLabel(reference);
  const showLiveLabel = isOnlyReferenceInField && liveText !== null;

  return (
    <Tag
      color={parsed?.color || 'blue'}
      title={liveText !== null ? `${staticLabel} = ${liveText}` : staticLabel}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginInlineEnd: 0, maxWidth: 260 }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {showLiveLabel ? liveText : staticLabel}
      </span>
      {!readOnly ? (
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
  );
}

export function RequestReferenceTokens({ value, readOnly, onChange }: Props) {
  const refs = splitReferences(value);
  if (!refs.length) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {refs.map((reference, index) => (
        <ReferenceTag
          key={`${reference}-${index}`}
          reference={reference}
          isOnlyReferenceInField={refs.length === 1}
          readOnly={readOnly}
          onRemove={() => onChange(refs.filter((_, current) => current !== index).join('; '))}
        />
      ))}
    </div>
  );
}
