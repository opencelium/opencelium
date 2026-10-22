import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { NewFeature } from '@shared/ui/feedback/NewFeature/NewFeature';
import type { WorkflowIssueGroups } from './useWorkflowIssues';

type Props = {
	issues: WorkflowIssueGroups;
	onOpen: () => void;
};

/**
 * Counts the steps that stand in the way of a save; notices alone do not raise it.
 * Always rendered: hiding it when clean would shift the header controls on every
 * edit that adds or fixes a problem, and leave no explicit "all clear".
 */
export function WorkflowProblemsBadge({ issues, onOpen }: Props) {
	const { t } = useI18n('workflow');
	const count = issues.errors.length + issues.warnings.length;
	const severity = issues.errors.length > 0 ? 'error' : count > 0 ? 'warning' : 'clean';
	return (
		<NewFeature id="workflow-problems" placement="bottom"
			tooltip={severity === 'clean' ? t('problems.badgeTooltipClean') : t('problems.badgeTooltip', { count })}>
			<Button type="text" iconLeft={severity === 'clean' ? 'check-circle' : 'warning'} onClick={onOpen}
				testId="workflow-problems-badge" className={`workflowProblemsBadge workflowProblemsBadge--${severity}`}>
				{severity === 'clean' ? null : count}
			</Button>
		</NewFeature>
	);
}
