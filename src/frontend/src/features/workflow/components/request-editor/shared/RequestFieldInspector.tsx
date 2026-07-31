import { Alert, Button, Card, Space, Tag, Typography } from 'antd';
import type { BodySelection } from '../body-editor/bodyValue';
import { hasMixedReferenceValue, hasOnlyReferences } from '../body-editor/bodyReference';
import { RequestReferenceTokens } from './RequestReferenceTokens';
import { useI18n } from '@shared/i18n/hooks/useI18n';

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
  const { t } = useI18n('workflow');
  const stringValue = typeof value === 'string' ? value : '';
  const isReferenceValue = hasOnlyReferences(value);
  const isMixedValue = hasMixedReferenceValue(value);
  const preview =
    typeof value === 'string'
      ? value || t('inspector.empty')
      : value === undefined
        ? t('inspector.selectField')
        : JSON.stringify(value, null, 2);

  return (
    <Card
      title={title}
      extra={
        selection ? (
          <Space size={12}>
            <Tag color="blue">{selection.pathLabel}</Tag>
            <Button type="primary" disabled={readOnly} onClick={onInsertReference}>{t('actions.insertReference')}</Button>
            <Button disabled={readOnly} onClick={onClear}>{t('inspector.clear')}</Button>
          </Space>
        ) : null
      }
      style={{ borderRadius: 12 }}
    >
      {selection ? (
        <div style={{ display: 'grid', gap: 12 }}>
          <Typography.Text type="secondary">{t('inspector.selectedValue')}</Typography.Text>
          {isMixedValue ? (
            <Alert
              type="warning"
              message={t('inspector.mixedValueTitle')}
              description={t('inspector.mixedValueDescription')}
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
        <Typography.Text type="secondary">{t('inspector.help')}</Typography.Text>
      )}
    </Card>
  );
}
