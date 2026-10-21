import { useCallback } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { SaveWarningsList } from '../problems/SaveWarningsList';
import { useWorkflowProblemText } from '../problems/useWorkflowProblemText';
import { buildWorkflowIssues } from '../problems/buildWorkflowIssues';
import { filterIssuesBySeverity, type WorkflowProblemSeverity } from '../problems/workflowProblems';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';

type BlockedAction = 'save' | 'test-run';

const BLOCKED_KEYS: Record<BlockedAction, { single: string; many: string }> = {
	save: { single: 'messages.saveBlockedIn', many: 'messages.saveBlocked' },
	'test-run': { single: 'messages.testRunBlockedIn', many: 'messages.testRunBlocked' },
};

type Params = {
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	setNodeError: (nodeId: string, message: string) => void;
	centerOnNode: (nodeId: string) => void;
};

/**
 * The save-time half of the problems the minimap lists. Errors refuse every save,
 * including the automatic one after a rename; warnings only ask on an explicit
 * Save, where the user is about to commit the graph on purpose.
 */
export const useSaveProblemsGate = ({ nodes, edges, setNodeError, centerOnNode }: Params) => {
	const { t } = useI18n('workflow');
	const confirm = useConfirm();
	const describe = useWorkflowProblemText();

	const issuesOf = useCallback((severity: WorkflowProblemSeverity, fieldBindings?: readonly unknown[]) =>
		filterIssuesBySeverity(buildWorkflowIssues(nodes, edges, fieldBindings, undefined, describe), severity),
	[nodes, edges, describe]);

	const validateBlockingProblems = useCallback((action: BlockedAction,
		fieldBindings?: readonly unknown[]): string | null => {
		const errors = issuesOf('error', fieldBindings);
		if (errors.length === 0) return null;
		errors.forEach((issue) => setNodeError(issue.nodeId, issue.problems.map(describe).join(' ')));
		centerOnNode(errors[0].nodeId);
		const [only] = errors;
		return errors.length === 1
			? t(BLOCKED_KEYS[action].single, { step: only.title, problem: describe(only.problems[0]) })
			: t(BLOCKED_KEYS[action].many, { count: errors.length });
	}, [issuesOf, setNodeError, centerOnNode, describe, t]);
	const validateSaveProblems = useCallback((fieldBindings?: readonly unknown[]) =>
		validateBlockingProblems('save', fieldBindings), [validateBlockingProblems]);
	const validateTestRunProblems = useCallback((fieldBindings?: readonly unknown[]) =>
		validateBlockingProblems('test-run', fieldBindings), [validateBlockingProblems]);

	const confirmSaveWarnings = useCallback(async (fieldBindings?: readonly unknown[]): Promise<boolean> => {
		const warnings = issuesOf('warning', fieldBindings);
		if (warnings.length === 0) return true;
		return confirm({
			title: t('saveProblems.confirmTitle'),
			message: <SaveWarningsList intro={t('saveProblems.confirmMessage')} issues={warnings} />,
			confirmText: t('saveProblems.saveAnyway'),
		});
	}, [issuesOf, confirm, t]);

	return { validateSaveProblems, validateTestRunProblems, confirmSaveWarnings };
};
