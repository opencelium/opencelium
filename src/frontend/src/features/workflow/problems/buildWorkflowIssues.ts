import type { ConnectorMetaDTO } from '@entities/connector/model/types';
import { buildBindingGraph } from '../lens/buildBindingGraph';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { countUnknownReferencePaths } from './unknownReferencePaths';
import { collectWorkflowIssues, dropEchoedValidation, type WorkflowProblem } from './workflowProblems';

/** The one way into the problem list, so the minimap, the badge and the save gate never disagree. */
export const buildWorkflowIssues = (nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[],
	fieldBindings: readonly unknown[] | undefined, liveHealth: readonly ConnectorMetaDTO[] | undefined,
	describe: (problem: WorkflowProblem) => string) => {
	const bindingGraph = buildBindingGraph(nodes, edges, fieldBindings);
	return dropEchoedValidation(collectWorkflowIssues({ nodes, bindingGraph, liveHealth,
		unknownPaths: countUnknownReferencePaths(nodes, bindingGraph) }), describe);
};
