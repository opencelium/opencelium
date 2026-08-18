import { Alert } from '@shared/ui/primitives/Alert';
import { Button } from '@shared/ui/primitives/Button';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type Props = {
  errorKey?: string | null;
  onRetry: () => void;
};

export function GraphQlBodyEditorError({ errorKey, onRetry }: Props) {
  const { t } = useI18n('workflow');
  const missingPassword = errorKey === 'masterPasswordNotConfigured';

  return <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
    <div data-testid="workflow-graphql-error"
      style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <Alert type={missingPassword ? 'warning' : 'error'} showIcon
        message={t(`graphqlBody.${errorKey ?? 'loginFailed'}`)}
        description={missingPassword
          ? t('graphqlBody.masterPasswordNotConfiguredDescription') : undefined}
      />
      <Button onClick={onRetry} testId="workflow-graphql-retry">
        {t('graphqlBody.retry')}
      </Button>
    </div>
  </div>;
}
