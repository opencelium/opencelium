import type { NodeProps } from '@xyflow/react';
import type { ConnectorWorkflowNode } from '../../types/workflow.types';
import { NodeShell } from '../NodeShell/NodeShell';
import { StandardNodeHandles } from '../StandardNodeHandles/StandardNodeHandles';
import { ConnectorMethodNodeContent } from './ConnectorMethodNodeContent';

export function ConnectorMethodNode({ id, data, selected, dragging }: NodeProps<ConnectorWorkflowNode>) {
  const suppressTooltip = Boolean(dragging || data.isAnyNodeDragging);

  return (
    <NodeShell
      id={id}
      data={data}
      selected={selected}
      bottomLabel={data.subtitle || data.title}
      rightAdd={{
        action: { sourceNodeId: id, direction: 'right' },
        showAlways: !!data.isLeaf && !data.jump,
        lineVisible: !!data.isLeaf && !data.jump,
      }}
    >
      <ConnectorMethodNodeContent id={id} data={data} suppressTooltip={suppressTooltip} />

      <StandardNodeHandles />
    </NodeShell>
  );
}
