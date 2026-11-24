import { useMemo } from 'react';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { evaluateJointTargets, type JointFieldBinding } from '../utils/jumpValidator';

/**
 * The selected method whose Add joint action would open a picker with nothing to
 * pick, or null. Only the single-selection case is evaluated: that is the only
 * one that shows a node toolbar, and it keeps this to one validator pass.
 */
export const useJointDeadEndNodeId = (
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
	fieldBindings: readonly JointFieldBinding[] = [],
) => useMemo(() => {
	const selected = nodes.filter((node) => node.selected);
	if (selected.length !== 1) return null;
	const [node] = selected;
	const isJointSource = (node.data.kind === 'connector' || node.data.kind === 'system') && !node.data.jump;
	if (!isJointSource) return null;
	const verdicts = evaluateJointTargets(node.id, nodes, edges, fieldBindings);
	return [...verdicts.values()].some((verdict) => verdict.valid) ? null : node.id;
}, [nodes, edges, fieldBindings]);
