import { resolveConnectorIconUrl } from '@entities/connector/model/iconUrl';
import { useLiveConnectorStatus } from '@entities/connector/socket/useLiveConnectorStatus';
import type { NodeProps } from '@xyflow/react';
import { useEffect, useState } from 'react';
import { Icon } from '@shared/ui/primitives/Icon';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { ConnectorStatusDot } from '../../connector-status/ConnectorStatusDot/ConnectorStatusDot';
import type { ConnectorWorkflowNode } from '../../types/workflow.types';
import { AggregatorBadge } from '../AggregatorBadge/AggregatorBadge';
import { MethodColorBadge } from '../MethodColorBadge/MethodColorBadge';
import { NodeShell } from '../NodeShell/NodeShell';
import { StandardNodeHandles } from '../StandardNodeHandles/StandardNodeHandles';

export function ConnectorMethodNode({ id, data, selected, dragging }: NodeProps<ConnectorWorkflowNode>) {
  const connectorIconUrl = resolveConnectorIconUrl(data.connector?.icon);
  // Live socket-driven status wins over the snapshot baked into node data at
  // hydration time — falls back to it until the meta cache has loaded.
  const liveStatus = useLiveConnectorStatus(data.connector?.connectorId);
  const connectorStatus = liveStatus?.status ?? data.connector?.status;
  const lastTestError = liveStatus?.lastTestError ?? data.connector?.lastTestError;
  const lastCheckedAt = liveStatus?.lastCheckedAt ?? data.connector?.lastCheckedAt;
  const suppressTooltip = dragging || data.isAnyNodeDragging;
  const [iconFailed, setIconFailed] = useState(false);
  const icon = connectorIconUrl && !iconFailed ? (
    <img className="circleNodeImage" src={connectorIconUrl} alt="" onError={() => setIconFailed(true)} />
  ) : (
    <Icon name="connector" size={24} />
  );

  useEffect(() => {
    if (iconFailed) {
      setIconFailed(false);
    }
  }, [connectorIconUrl]);

  return (
    <NodeShell
      id={id}
      data={data}
      selected={selected}
      bottomLabel={data.subtitle || data.title}
      rightAdd={{
        action: { sourceNodeId: id, direction: 'right' },
        showAlways: !!data.isLeaf,
        lineVisible: !!data.isLeaf,
      }}
    >
      <div className="circleNode">
        {data.connector?.title && !suppressTooltip ? (
          <Tooltip content={data.connector.title}>{icon}</Tooltip>
        ) : icon}
        <MethodColorBadge
          color={data.duplicateMethodColor}
          index={data.duplicateMethodIndex}
          suppressTooltip={suppressTooltip}
        />
        <AggregatorBadge
          dataAggregator={data.dataAggregator}
          testId={`workflow-node-aggregator-${id}`}
          suppressTooltip={suppressTooltip}
          onOpenAggregatorEditor={() => data.onOpenAggregatorEditor?.(id)}
        />
        {connectorStatus ? (
          <div className="circleNodeStatus">
            <ConnectorStatusDot
              status={connectorStatus}
              testId={`workflow-node-connector-status-${id}`}
              tooltipOverride={connectorStatus === 'AUTH_FAILED' || connectorStatus === 'DOWN' ? lastTestError : undefined}
              suppressTooltip={suppressTooltip}
              lastCheckedAt={lastCheckedAt}
            />
          </div>
        ) : null}
      </div>

      <StandardNodeHandles />
    </NodeShell>
  );
}
