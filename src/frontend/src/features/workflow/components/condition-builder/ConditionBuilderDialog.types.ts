import type { Connection } from '../../types/connection';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import type { ConditionConfig } from './conditionBuilder.types';

export type ConditionBuilderDialogProps = {
  open: boolean;
  node: WorkflowNodeModel | null;
  nodes: WorkflowNodeModel[];
  edges: WorkflowEdgeModel[];
  connection: Connection;
  onClose: () => void;
  onSave: (nodeId: string, config: ConditionConfig) => void;
};
