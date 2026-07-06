import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';

export type ConnectorStatus = 'passed' | 'failed';

type Appearance = {
  color: string;
  tooltipKey: 'passed' | 'failed';
};

const statusToAppearance = (status: ConnectorStatus): Appearance => {
  switch (status) {
    case 'passed':
      return { color: 'var(--color-status-success-fg)', tooltipKey: 'passed' };
    case 'failed':
      return { color: 'var(--color-status-error-fg)', tooltipKey: 'failed' };
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
  // Overrides the default tooltip text — used to surface the connector's actual
  // lastTestError on hover instead of the generic "check failed" copy.
  tooltipOverride?: string | null;
};

export function ConnectorStatusDot({ status, size = 9, className, testId, tooltipOverride }: Props) {
  const { t } = useI18n('workflow');
  const { color, tooltipKey } = statusToAppearance(status);
  const tooltipContent = tooltipOverride || t(`sidebar.connectorStatus.${tooltipKey}`);

  return (
    <Tooltip content={tooltipContent}>
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
