import { Button, Result } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type Props = { onRetry: () => void; onCancel: () => void };

export function WorkflowLoadError({ onRetry, onCancel }: Props) {
 const { t } = useI18n('workflow');
 return <div className="page" data-testid="workflow-load-error">
  <Result status="error" title={t('loadError.title')} subTitle={t('loadError.description')}
   extra={<>
    <Button type="primary" data-testid="workflow-load-retry" onClick={onRetry}>{t('loadError.retry')}</Button>
    <Button data-testid="workflow-load-cancel" onClick={onCancel}>{t('actions.cancel')}</Button>
   </>} />
 </div>;
}
