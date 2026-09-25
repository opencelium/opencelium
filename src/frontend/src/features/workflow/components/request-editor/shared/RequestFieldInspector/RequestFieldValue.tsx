import { Alert } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { hasMixedReferenceValue, hasOnlyReferences } from '../../body-editor/bodyReference';
import { RequestReferenceTokens } from '../RequestReferenceTokens/RequestReferenceTokens';

export function RequestFieldValue({ value, readOnly, onChange }: {
  value: unknown; readOnly?: boolean; onChange: (next: string) => void;
}) {
  const { t } = useI18n('workflow');
  const stringValue = typeof value === 'string' ? value : '';
  const preview = typeof value === 'string' ? value || t('inspector.empty')
    : value === undefined ? t('inspector.selectField') : JSON.stringify(value, null, 2);

  return <>
    {hasMixedReferenceValue(value) && <Alert type="warning"
      message={t('inspector.mixedValueTitle')}
      description={t('inspector.mixedValueDescription')} />}
    {hasOnlyReferences(value)
      ? <RequestReferenceTokens value={stringValue} readOnly={readOnly} onChange={onChange} />
      : <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
        {preview}
      </pre>}
  </>;
}
