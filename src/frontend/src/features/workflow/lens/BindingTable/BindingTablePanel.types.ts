import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import type { LensBinding } from '../bindingLens.types';

export type BindingTablePanelProps = {
	open: boolean;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings?: readonly unknown[];
	/** Marks the row whose binding the editor drawer currently holds. */
	selectedKey: string | null;
	/** The editor drawer is open, so this panel steps aside for it. */
	isDetailOpen: boolean;
	onClose: () => void;
	onSelectBinding: (binding: LensBinding) => void;
};
