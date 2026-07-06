import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Globe } from 'lucide-react';
import { NodeShell } from './NodeShell';
import { MethodColorBadge } from './MethodColorBadge';
import { resolveConnectorIconUrl } from '@entities/connector/model/iconUrl';
import type { ConnectorWorkflowNode } from '../types/workflow.types';
import { useConnectorStatus } from '../connector-status/useConnectorStatus';
import { ConnectorStatusDot } from '../connector-status/ConnectorStatusDot';

export function ConnectorMethodNode({
  id,
  data,
  selected,
}: NodeProps<ConnectorWorkflowNode>) {
  const connectorIconUrl = resolveConnectorIconUrl(data.connector?.icon);
  const { getStatus } = useConnectorStatus();
  const connectorStatus = data.connector ? getStatus(data.connector.connectorId) : undefined;

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
          <Globe size={24} />
        )}
        <MethodColorBadge color={data.duplicateMethodColor} index={data.duplicateMethodIndex} />
        {connectorStatus ? (
          <div className="circleNodeStatus">
            <ConnectorStatusDot status={connectorStatus} testId={`workflow-node-connector-status-${id}`} />
          </div>
        ) : null}
      </div>

      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className="handleInvisible"
      />
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        className="handleInvisible"
      />
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="handleInvisible"
      />
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className="handleInvisible"
      />
    </NodeShell>
  );
}
