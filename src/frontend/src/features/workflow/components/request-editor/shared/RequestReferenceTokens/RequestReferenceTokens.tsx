import { CloseOutlined } from '@ant-design/icons';
import { Button, Tag } from 'antd';
import { getParsedReferences, splitReferences } from '../../body-editor/bodyReference';
import { getReferenceDisplayLabel } from '../referenceDisplay';
import type { RequestReferenceTokensProps } from './RequestReferenceTokens.types';

export function RequestReferenceTokens({ value, readOnly, onChange }: RequestReferenceTokensProps) {
  const references = splitReferences(value);
  if (!references.length) return null;

  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
    {references.map((reference, index) => <Tag key={`${reference}-${index}`}
      color={getParsedReferences(reference)[0]?.color || 'blue'}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginInlineEnd: 0 }}>
      <span>{getReferenceDisplayLabel(reference)}</span>
      {!readOnly && <Button type="text" size="small" icon={<CloseOutlined />}
        onClick={(event) => {
          event.stopPropagation();
          onChange(references.filter((_, current) => current !== index).join('; '));
        }}
        style={{ width: 16, height: 16, minWidth: 16, padding: 0, color: 'inherit' }} />}
    </Tag>)}
  </div>;
}
