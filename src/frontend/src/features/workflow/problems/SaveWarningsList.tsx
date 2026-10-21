import { Typography } from '@shared/ui/primitives/Typography';
import type { WorkflowIssue } from './workflowProblems';
import { useWorkflowProblemText } from './useWorkflowProblemText';

type Props = {
	intro: string;
	issues: WorkflowIssue[];
};

export function SaveWarningsList({ intro, issues }: Props) {
	const describe = useWorkflowProblemText();
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
		</div>
	);
}
