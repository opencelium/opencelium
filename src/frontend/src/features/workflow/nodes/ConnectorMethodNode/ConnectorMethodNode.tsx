import { resolveConnectorIconUrl } from '@entities/connector/model/iconUrl';
import type { NodeProps } from '@xyflow/react';
import { Icon } from '@shared/ui/primitives/Icon';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { ConnectorStatusDot } from '../../connector-status/ConnectorStatusDot/ConnectorStatusDot';
import { getConnectorStatus } from '../../connector-status/getConnectorStatus';
import type { ConnectorWorkflowNode } from '../../types/workflow.types';
import { AggregatorBadge } from '../AggregatorBadge/AggregatorBadge';
import { MethodColorBadge } from '../MethodColorBadge/MethodColorBadge';
import { NodeShell } from '../NodeShell/NodeShell';
import { StandardNodeHandles } from '../StandardNodeHandles/StandardNodeHandles';

export function ConnectorMethodNode({ id, data, selected, dragging }: NodeProps<ConnectorWorkflowNode>) {
  const connectorIconUrl = resolveConnectorIconUrl(data.connector?.icon);
  const connectorStatus = getConnectorStatus(data.connector?.lastTestPassed);
  const suppressTooltip = dragging || data.isAnyNodeDragging;
  const icon = connectorIconUrl ? (
    <img className="circleNodeImage" src={connectorIconUrl} alt="" />
  ) : (
    <Icon name="connector" size={24} />
  );

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
        />
        {connectorStatus ? (
          <div className="circleNodeStatus">
            <ConnectorStatusDot
              status={connectorStatus}
              testId={`workflow-node-connector-status-${id}`}
              tooltipOverride={connectorStatus === 'failed' ? data.connector?.lastTestError : undefined}
              suppressTooltip={suppressTooltip}
            />
          </div>
        ) : null}
      </div>

      <StandardNodeHandles />
    </NodeShell>
  );
}
