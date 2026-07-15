import { resolveConnectorIconUrl } from '@entities/connector/model/iconUrl';
import type { NodeProps } from '@xyflow/react';
import { Icon } from '@shared/ui/primitives/Icon';
import { ConnectorStatusDot } from '../../connector-status/ConnectorStatusDot';
import { getConnectorStatus } from '../../connector-status/getConnectorStatus';
import type { ConnectorWorkflowNode } from '../../types/workflow.types';
import { MethodColorBadge } from '../MethodColorBadge';
import { NodeShell } from '../NodeShell';
import { StandardNodeHandles } from '../StandardNodeHandles/StandardNodeHandles';

export function ConnectorMethodNode({ id, data, selected, dragging }: NodeProps<ConnectorWorkflowNode>) {
  const connectorIconUrl = resolveConnectorIconUrl(data.connector?.icon);
  const connectorStatus = getConnectorStatus(data.connector?.lastTestPassed);

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
        {connectorIconUrl ? (
          <img className="circleNodeImage" src={connectorIconUrl} alt="" />
        ) : (
          <Icon name="connector" size={24} />
        )}
        <MethodColorBadge color={data.duplicateMethodColor} index={data.duplicateMethodIndex} />
        {connectorStatus ? (
          <div className="circleNodeStatus">
            <ConnectorStatusDot
              status={connectorStatus}
              testId={`workflow-node-connector-status-${id}`}
              tooltipOverride={connectorStatus === 'failed' ? data.connector?.lastTestError : undefined}
              suppressTooltip={dragging || data.isAnyNodeDragging}
            />
          </div>
        ) : null}
      </div>

      <StandardNodeHandles />
    </NodeShell>
  );
}
