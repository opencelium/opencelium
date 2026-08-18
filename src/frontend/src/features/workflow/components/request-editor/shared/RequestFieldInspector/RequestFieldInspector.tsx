import { Button, Card, Space, Tag, Typography } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { RequestFieldInspectorProps } from './RequestFieldInspector.types';
import { RequestFieldValue } from './RequestFieldValue';

export function RequestFieldInspector({ title, selection, value, readOnly,
  onInsertReference, onClear, onChangeReferences }: RequestFieldInspectorProps) {
  const { t } = useI18n('workflow');
  const actions = selection ? <Space size={12}>
    <Tag color="blue">{selection.pathLabel}</Tag>
    <Button type="primary" disabled={readOnly} onClick={onInsertReference}>
      {t('actions.insertReference')}</Button>
    <Button disabled={readOnly} onClick={onClear}>{t('inspector.clear')}</Button>
  </Space> : null;

  return <Card title={title} extra={actions} style={{ borderRadius: 12 }}>
    {selection ? <div style={{ display: 'grid', gap: 12 }}>
      <Typography.Text type="secondary">{t('inspector.selectedValue')}</Typography.Text>
      <RequestFieldValue value={value} readOnly={readOnly} onChange={onChangeReferences} />
    </div> : <Typography.Text type="secondary">{t('inspector.help')}</Typography.Text>}
  </Card>;
}
