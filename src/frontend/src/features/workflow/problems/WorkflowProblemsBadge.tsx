import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { WorkflowIssueGroups } from './useWorkflowIssues';

type Props = {
	issues: WorkflowIssueGroups;
	onOpen: () => void;
};

/** Counts the steps that stand in the way of a save; notices alone do not raise it. */
export function WorkflowProblemsBadge({ issues, onOpen }: Props) {
	const { t } = useI18n('workflow');
	const count = issues.errors.length + issues.warnings.length;
	if (count === 0) return null;
	const severity = issues.errors.length > 0 ? 'error' : 'warning';
	return (
		<Tooltip content={t('problems.badgeTooltip', { count })} placement="bottom">
			<Button type="text" iconLeft="warning" onClick={onOpen} testId="workflow-problems-badge"
				className={`workflowProblemsBadge workflowProblemsBadge--${severity}`}>
				{count}
			</Button>
		</Tooltip>
	);
}
