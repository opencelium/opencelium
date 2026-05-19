import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Globe } from 'lucide-react';
import { NodeShell } from './NodeShell';
import type { ConnectorWorkflowNode } from '../types/workflow.types';

const resolveConnectorIconUrl = (icon?: string | null) => {
  if (!icon?.trim()) return null;
  if (/^(blob:|data:|https?:\/\/)/i.test(icon)) return icon;

  const normalizedIcon = icon.replace(/^\.\//, '');
  if (normalizedIcon.startsWith('storage/')) {
    const baseUrl = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/$/, '');
    return `${baseUrl}/${normalizedIcon}`;
  }

  return icon;
};

export function ConnectorMethodNode({
  id,
  data,
  selected,
}: NodeProps<ConnectorWorkflowNode>) {
  const connectorIconUrl = resolveConnectorIconUrl(data.connector?.icon);

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
