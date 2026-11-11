import type { ConditionConfig } from '../components/condition-builder/conditionBuilder.types';
import type { MethodDraft } from '../components/request-editor/MethodConfigDialog/MethodConfigDialog.types';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { AiDialogStep } from '../utils/aiDialogSteps';
import type { WorkflowHistoryStep } from './useWorkflowUndoHistory';
import { withConditionConfig, withMethodConfig } from './useWorkflowNodeUpdates';

type GraphState = { nodes: WorkflowNodeModel[]; edges: WorkflowEdgeModel[]; fieldBindings: unknown[] | undefined };

/** A method dialog's steps as graph states, built the way its save builds the final one. */
export const methodStepsToHistory = (graph: GraphState, nodeId: string,
	steps: AiDialogStep<MethodDraft>[]): WorkflowHistoryStep[] => steps.map((step) => ({
	nodes: step.draft.config ? withMethodConfig(graph.nodes, nodeId, step.draft.config) : graph.nodes,
	edges: graph.edges,
	fieldBindings: Array.isArray(step.draft.fieldBindings) ? step.draft.fieldBindings : graph.fieldBindings,
	origin: step.origin,
	at: step.at,
}));

/** A condition dialog's steps as graph states, built the way its save builds the final one. */
export const conditionStepsToHistory = (graph: GraphState, nodeId: string,
	steps: AiDialogStep<ConditionConfig>[]): WorkflowHistoryStep[] => steps.map((step) => ({
	nodes: withConditionConfig(graph.nodes, nodeId, step.draft),
	edges: graph.edges,
	fieldBindings: graph.fieldBindings,
	origin: step.origin,
	at: step.at,
}));
