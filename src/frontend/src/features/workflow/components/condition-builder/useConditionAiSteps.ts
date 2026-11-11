import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { WorkflowNodeModel } from '../../types/workflow.types';
import { createAiDialogSteps, type AiDialogStep } from '../../utils/aiDialogSteps';
import { sortValue } from '../../utils/workflowPage.utils';
import type { ConditionConfig, ConditionGroup } from './conditionBuilder.types';
import { buildConditionConfig, getInitialTreeFromConfig, validateConditionTreeWithErrors } from './conditionBuilder.utils';

type Params = {
	open: boolean;
	node: WorkflowNodeModel | null;
	operatorType: 'if' | 'loop';
	/** The rules as they are now; an AI build that finishes later is recorded against the latest ones. */
	tree: ConditionGroup;
	loopIterator?: string;
	onRecordAiSteps?: (nodeId: string, steps: AiDialogStep<ConditionConfig>[]) => void;
};

const identity = (config: ConditionConfig) => JSON.stringify(sortValue(config) ?? null);

/** The condition dialog's AI builds, kept as drafts so its save records each one as its own history entry. */
export function useConditionAiSteps({ open, node, operatorType, tree, loopIterator, onRecordAiSteps }: Params) {
	const steps = useMemo(() => createAiDialogSteps<ConditionConfig>(identity), []);
	const latestTree = useRef(tree);
	useEffect(() => {
		latestTree.current = tree;
	}, [tree]);
	// The same pipeline the save runs, so the last AI step and an untouched save are the same state.
	const draftOf = useCallback((tree: ConditionGroup) =>
		buildConditionConfig(operatorType, validateConditionTreeWithErrors(tree, operatorType).tree, loopIterator),
	[loopIterator, operatorType]);

	useEffect(() => {
		if (open) steps.start(draftOf(getInitialTreeFromConfig(node, operatorType)));
	}, [draftOf, node, open, operatorType, steps]);

	const recordBuild = (built: ConditionGroup) => {
		steps.record(draftOf(latestTree.current), draftOf(built));
	};
	const handOver = (nodeId: string) => {
		const taken = steps.take();
		if (taken.length) onRecordAiSteps?.(nodeId, taken);
	};

	return { recordBuild, handOver };
}
