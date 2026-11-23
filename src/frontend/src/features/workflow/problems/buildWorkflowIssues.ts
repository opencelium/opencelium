import type { JSONPathEnvironment } from 'json-p3';
import type { ConnectorMetaDTO } from '@entities/connector/model/types';
import { buildBindingGraph } from '../lens/buildBindingGraph';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { countInvalidReferencePaths } from './invalidReferencePaths';
import { countUnknownReferencePaths } from './unknownReferencePaths';
import { collectWorkflowIssues, dropEchoedValidation, type WorkflowProblem } from './workflowProblems';

type Params = {
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings: readonly unknown[] | undefined;
	liveHealth: readonly ConnectorMetaDTO[] | undefined;
	describe: (problem: WorkflowProblem) => string;
	/** null until json-p3 has loaded; the path syntax check is skipped until then. */
	jsonPathEnvironment: JSONPathEnvironment | null;
};

/** The one way into the problem list, so the minimap, the badge and the save gate never disagree. */
export const buildWorkflowIssues = ({ nodes, edges, fieldBindings, liveHealth, describe, jsonPathEnvironment }: Params) => {
	const bindingGraph = buildBindingGraph(nodes, edges, fieldBindings);
	return dropEchoedValidation(collectWorkflowIssues({ nodes, bindingGraph, liveHealth,
		unknownPaths: countUnknownReferencePaths(nodes, bindingGraph),
		invalidPaths: countInvalidReferencePaths(jsonPathEnvironment, nodes, fieldBindings) }), describe);
};
