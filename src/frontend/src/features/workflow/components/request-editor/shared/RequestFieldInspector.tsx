import { Alert, Button, Card, Space, Tag, Typography } from 'antd';
import type { BodySelection } from '../body-editor/bodyValue';
import { hasMixedReferenceValue, hasOnlyReferences } from '../body-editor/bodyReference';
import { RequestReferenceTokens } from './RequestReferenceTokens';

type Props = {
  title: string;
  selection: BodySelection | null;
  value: unknown;
  readOnly?: boolean;
  onInsertReference: () => void;
  onClear: () => void;
  onChangeReferences: (next: string) => void;
};

export function RequestFieldInspector({
  title,
  selection,
  value,
  readOnly,
  onInsertReference,
  onClear,
  onChangeReferences,
}: Props) {
  const stringValue = typeof value === 'string' ? value : '';
  const isReferenceValue = hasOnlyReferences(value);
  const isMixedValue = hasMixedReferenceValue(value);
  const preview =
    typeof value === 'string'
      ? value || 'Empty'
      : value === undefined
        ? 'Select a field'
        : JSON.stringify(value, null, 2);

  return (
    <Card
      title={title}
      extra={
        selection ? (
          <Space size={12}>
            <Tag color="blue">{selection.pathLabel}</Tag>
            <Button type="primary" disabled={readOnly} onClick={onInsertReference}>Insert reference</Button>
            <Button disabled={readOnly} onClick={onClear}>Clear</Button>
          </Space>
        ) : null
      }
      style={{ borderRadius: 12 }}
    >
      {selection ? (
        <div style={{ display: 'grid', gap: 12 }}>
          <Typography.Text type="secondary">Selected value</Typography.Text>
          {isMixedValue ? (
            <Alert
              type="warning"
              message="Mixed value"
              description="This field should contain either plain text or references only. Mixed values are not allowed."
            />
          ) : null}
          {isReferenceValue ? (
            <RequestReferenceTokens value={stringValue} readOnly={readOnly} onChange={onChangeReferences} />
          ) : (
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
              {preview}
            </pre>
          )}
        </div>
      ) : (
        <Typography.Text type="secondary">Select a primitive field in the JSON tree to inspect and attach references.</Typography.Text>
      )}
    </Card>
  );
}
