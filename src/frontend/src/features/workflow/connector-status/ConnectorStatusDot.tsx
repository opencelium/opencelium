import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { ConnectorStatus } from './ConnectorStatusContext';

type Appearance = {
  color: string;
  tooltipKey: 'checking' | 'passed' | 'failed' | 'locked';
};

const statusToAppearance = (status: ConnectorStatus): Appearance => {
  switch (status) {
    case 'checking':
      return { color: 'var(--color-status-warning-fg)', tooltipKey: 'checking' };
    case 'passed':
      return { color: 'var(--color-status-success-fg)', tooltipKey: 'passed' };
    case 'failed':
      return { color: 'var(--color-status-error-fg)', tooltipKey: 'failed' };
    case 'locked':
      return { color: 'var(--color-text-secondary)', tooltipKey: 'locked' };
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
};

type Props = {
  status: ConnectorStatus;
  size?: number;
  className?: string;
  testId?: string;
};

export function ConnectorStatusDot({ status, size = 9, className, testId }: Props) {
  const { t } = useI18n('workflow');
  const { color, tooltipKey } = statusToAppearance(status);

  return (
    <Tooltip content={t(`sidebar.connectorStatus.${tooltipKey}`)}>
      <span
        className={className}
        data-testid={testId}
        style={{
          display: 'inline-block',
          width: size,
          height: size,
          minWidth: size,
          borderRadius: size,
          background: color,
          flexShrink: 0,
        }}
      />
    </Tooltip>
  );
}
