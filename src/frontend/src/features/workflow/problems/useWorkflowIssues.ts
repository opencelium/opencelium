import { useMemo } from 'react';
import { useGetConnectorsMetaQuery } from '@entities/connector/api/connectorApi';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { buildWorkflowIssues } from './buildWorkflowIssues';
import { useWorkflowProblemText } from './useWorkflowProblemText';
import { filterIssuesBySeverity } from './workflowProblems';

/**
 * The page-level view of the graph's problems, for the header badge and the problems
 * panel. Built from the page's graph state rather than the flow store (which the
 * minimap reads), so test-run failures are not part of it — they belong to the run,
 * which reports them in its own log.
 */
export const useWorkflowIssues = (nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[],
	fieldBindings: readonly unknown[] | undefined) => {
	const { data: liveHealth } = useGetConnectorsMetaQuery();
	const describe = useWorkflowProblemText();
	return useMemo(() => {
		const issues = buildWorkflowIssues(nodes, edges, fieldBindings, liveHealth, describe);
		return {
			errors: filterIssuesBySeverity(issues, 'error'),
			warnings: filterIssuesBySeverity(issues, 'warning'),
			notices: filterIssuesBySeverity(issues, 'notice'),
		};
	}, [nodes, edges, fieldBindings, liveHealth, describe]);
};

export type WorkflowIssueGroups = ReturnType<typeof useWorkflowIssues>;
