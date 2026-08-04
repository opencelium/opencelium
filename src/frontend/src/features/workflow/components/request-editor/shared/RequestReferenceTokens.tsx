import { CloseOutlined } from '@ant-design/icons';
import { Button, Tag } from 'antd';
import { getParsedReferences, splitReferences } from '../body-editor/bodyReference';
import { getReferenceDisplayLabel } from './referenceDisplay';

type Props = {
  value: string;
  readOnly?: boolean;
  onChange: (next: string) => void;
};

const getLabel = (reference: string) => {
  return getReferenceDisplayLabel(reference);
};

export function RequestReferenceTokens({ value, readOnly, onChange }: Props) {
  const refs = splitReferences(value);
  if (!refs.length) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {refs.map((reference, index) => {
        const parsed = getParsedReferences(reference)[0];
        return (
          <Tag key={`${reference}-${index}`} color={parsed?.color || 'blue'} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginInlineEnd: 0 }}>
            <span>{getLabel(reference)}</span>
            {!readOnly ? (
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={(event) => {
                  event.stopPropagation();
                  onChange(refs.filter((_, current) => current !== index).join('; '));
                }}
                style={{ width: 16, height: 16, minWidth: 16, padding: 0, color: 'inherit' }}
              />
            ) : null}
          </Tag>
        );
      })}
    </div>
  );
}
