import { useEffect, useState } from 'react';
import { resolveConnectorIconUrl } from '@entities/connector/model/iconUrl';
import { useLiveConnectorStatus } from '@entities/connector/socket/useLiveConnectorStatus';
import { Icon } from '@shared/ui/primitives/Icon';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { ConnectorStatusDot } from '../../connector-status/ConnectorStatusDot/ConnectorStatusDot';
import type { ConnectorWorkflowNode } from '../../types/workflow.types';
import { AggregatorBadge } from '../AggregatorBadge/AggregatorBadge';
import { MethodColorBadge } from '../MethodColorBadge/MethodColorBadge';

export function ConnectorMethodNodeContent({ id, data, suppressTooltip }: {
  id: string; data: ConnectorWorkflowNode['data']; suppressTooltip: boolean;
}) {
  const iconUrl = resolveConnectorIconUrl(data.connector?.icon);
  const liveStatus = useLiveConnectorStatus(data.connector?.connectorId);
  const status = liveStatus?.status ?? data.connector?.status;
  const lastError = liveStatus?.lastTestError ?? data.connector?.lastTestError;
  const lastCheckedAt = liveStatus?.lastCheckedAt ?? data.connector?.lastCheckedAt;
  const [iconFailed, setIconFailed] = useState(false);

  useEffect(() => {
    if (iconFailed) setIconFailed(false);
  }, [iconUrl]);

  const icon = iconUrl && !iconFailed
    ? <img className="circleNodeImage" src={iconUrl} alt=""
      onError={() => setIconFailed(true)} />
    : <Icon name="connector" size={24} />;

  return <div className="circleNode">
    {data.connector?.title && !suppressTooltip
      ? <Tooltip content={data.connector.title}>{icon}</Tooltip> : icon}
    <MethodColorBadge color={data.duplicateMethodColor} index={data.duplicateMethodIndex}
      suppressTooltip={suppressTooltip} />
    <AggregatorBadge dataAggregator={data.dataAggregator}
      testId={`workflow-node-aggregator-${id}`} suppressTooltip={suppressTooltip}
      onOpenAggregatorEditor={() => data.onOpenAggregatorEditor?.(id)} />
    {status && <div className="circleNodeStatus">
      <ConnectorStatusDot status={status} testId={`workflow-node-connector-status-${id}`}
        tooltipOverride={status === 'AUTH_FAILED' || status === 'DOWN' ? lastError : undefined}
        suppressTooltip={suppressTooltip} lastCheckedAt={lastCheckedAt} />
    </div>}
  </div>;
}
