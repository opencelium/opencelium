import { Typography } from '@shared/ui/primitives/Typography';
import { DocsLink } from '@shared/ui/actions/DocsLink';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { WorkflowIssue } from './workflowProblems';
import { useWorkflowProblemText } from './useWorkflowProblemText';

type Props = {
	intro: string;
	issues: WorkflowIssue[];
};

export function SaveWarningsList({ intro, issues }: Props) {
	const describe = useWorkflowProblemText();
	const { t } = useI18n('workflow');
	return (
		<div data-testid="workflow-save-warnings">
			<Typography>{intro}</Typography>
			<ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
				{issues.map((issue) => (
					<li key={issue.nodeId}>
						<Typography as="span" isBold>{issue.title}</Typography>
						{' — '}
						<Typography as="span" isSubtle>{issue.problems.map(describe).join(' ')}</Typography>
					</li>
				))}
			</ul>
			<div style={{ marginTop: 8 }}>
				<DocsLink page='guides/check-a-workflow' anchor='saving-with-problems' testId='workflow-save-warnings-docs'>
					{t('saveProblems.saveDocs')}
				</DocsLink>
			</div>
		</div>
	);
}
