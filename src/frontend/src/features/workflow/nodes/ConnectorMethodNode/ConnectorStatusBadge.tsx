import type { MouseEvent } from 'react';
import { isConnectorConnectionError } from '@entities/connector/model/connectorHealth';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { ConnectorStatusDot } from '../../connector-status/ConnectorStatusDot/ConnectorStatusDot';
import { getConnectorStatusAppearance } from '../../connector-status/ConnectorStatusDot/connectorStatusDot.utils';
import type { ConnectorStatus } from '../../connector-status/ConnectorStatusDot/ConnectorStatusDot.types';
import { useConnectorStatusTooltip } from '../../connector-status/ConnectorStatusDot/useConnectorStatusTooltip';
import { useOpenConnectorUpdateDialog } from '../../connector-status/useOpenConnectorUpdateDialog';

type Props = {
  nodeId: string;
  connectorId?: number;
  status: ConnectorStatus;
  lastError?: string | null;
  lastCheckedAt?: number | null;
  suppressTooltip: boolean;
};

const stopPropagation = (event: MouseEvent) => event.stopPropagation();

export function ConnectorStatusBadge({ nodeId, connectorId, status, lastError, lastCheckedAt, suppressTooltip }: Props) {
  const { t } = useI18n('workflow');
  const openConnectorUpdate = useOpenConnectorUpdateDialog();
  const hasConnectionError = isConnectorConnectionError(status);
  const statusTooltip = useConnectorStatusTooltip({
    status, tooltipOverride: hasConnectionError ? lastError : undefined, lastCheckedAt,
  });
  const { tooltipKey } = getConnectorStatusAppearance(status);
  const dotTestId = `workflow-node-connector-status-${nodeId}`;

  if (!hasConnectionError || connectorId == null) {
    return <div className="circleNodeStatus">
      <ConnectorStatusDot status={status} testId={dotTestId}
        tooltipOverride={hasConnectionError ? lastError : undefined}
        suppressTooltip={suppressTooltip} lastCheckedAt={lastCheckedAt} />
    </div>;
  }

  const handleFix = () => {
    // A failing connection is almost always a credentials problem, so skip the general step.
    openConnectorUpdate(String(connectorId), {
      testId: 'workflow-node-connector-update-dialog',
      initialStepId: 'credentials',
    });
  };

  const content = <span className="circleNodeStatusContent">
    <ConnectorStatusDot status={status} testId={dotTestId} suppressTooltip />
    <span className="circleNodeStatusFix">
      <IconButton iconProps={{ name: 'edit', size: 10 }} type="text" size="xs"
        testId={`workflow-node-connector-fix-${nodeId}`} onClick={handleFix} />
    </span>
  </span>;

  // The positioned wrapper must sit outside Tooltip — see AggregatorBadge.
  return <div className={`circleNodeStatus circleNodeStatus--fixable circleNodeStatus--${tooltipKey} nodrag nopan`}
    onClick={stopPropagation} onDoubleClick={stopPropagation}>
    {suppressTooltip ? content : (
      <Tooltip content={<>{statusTooltip}<br />{t('sidebar.connectorStep.fixConnector')}</>}
        placement="top" maxWidth={320}>
        {content}
      </Tooltip>
    )}
  </div>;
}
