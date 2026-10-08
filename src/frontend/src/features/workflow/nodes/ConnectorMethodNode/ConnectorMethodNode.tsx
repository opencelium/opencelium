import type { NodeProps } from '@xyflow/react';
import { buildTestId } from '@shared/testing/testId';
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
      // Named after the method rather than the generated node id, so a test or the
      // workflow tutorial can address "the getCustomers step" without knowing it.
      // The method name is the *subtitle*: `title` holds the connector it belongs to.
      // Kept in step with the label below deliberately — the id names what is shown.
      testId={buildTestId('workflow-node-method', data.subtitle || data.title)}
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
