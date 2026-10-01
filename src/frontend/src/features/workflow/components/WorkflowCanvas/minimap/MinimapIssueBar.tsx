import { useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { MinimapIssue } from './minimapIssues';
import { useMinimapProblemText } from './useMinimapProblemText';

type Props = {
	issues: MinimapIssue[];
	currentIndex: number;
	onNavigate: (step: -1 | 1) => void;
	onFocusCurrent: () => void;
};

export function MinimapIssueBar({ issues, currentIndex, onNavigate, onFocusCurrent }: Props) {
	const { t } = useI18n('workflow');
	const describe = useMinimapProblemText();
	// Collapsed by default so the card stays compact; kept across ‹ › so a user who
	// opened the details reads every step's the same way.
	const [isExpanded, setExpanded] = useState(false);
	const current = issues[currentIndex];
	if (!current) return null;
	const hasSeveral = issues.length > 1;

	return (
		<section className="workflowMinimapIssues" aria-live="polite" data-testid="workflow-minimap-issues">
			<div className="workflowMinimapIssuesHeader">
				<span className="workflowMinimapIssuesDot" aria-hidden />
				<span className="workflowMinimapIssuesCount">
					{t('minimap.attention', { count: issues.length })}
				</span>
				{hasSeveral && (
					<span className="workflowMinimapIssuesPager">
						<Tooltip content={t('minimap.previousIssue')}>
							<IconButton type="text" size="xs" iconProps={{ name: 'chevron-left', color: 'inherit', size: 14 }}
								onClick={() => onNavigate(-1)} testId="workflow-minimap-issue-prev" />
						</Tooltip>
						<span className="workflowMinimapIssuesCounter">
							{t('minimap.issueCounter', { current: currentIndex + 1, total: issues.length })}
						</span>
						<Tooltip content={t('minimap.nextIssue')}>
							<IconButton type="text" size="xs" iconProps={{ name: 'chevron-right', color: 'inherit', size: 14 }}
								onClick={() => onNavigate(1)} testId="workflow-minimap-issue-next" />
						</Tooltip>
					</span>
				)}
			</div>
			<div className="workflowMinimapIssueTitleRow">
				{/* A button, so the step's name is a way back to it once the canvas has moved on. */}
				<button type="button" className="workflowMinimapIssue" onClick={onFocusCurrent}
					data-testid="workflow-minimap-issue-current">
					{current.title}
				</button>
				<Tooltip content={t(isExpanded ? 'minimap.hideDetails' : 'minimap.showDetails')}>
					<IconButton type="text" size="xs" onClick={() => setExpanded((value) => !value)}
						iconProps={{ name: isExpanded ? 'chevron-up' : 'chevron-down', color: 'inherit', size: 14 }}
						testId="workflow-minimap-issue-details-toggle" />
				</Tooltip>
			</div>
			{isExpanded && (
				<div className="workflowMinimapIssueDetails" data-testid="workflow-minimap-issue-details">
					{current.problems.map((problem, index) => {
						const text = describe(problem);
						return <span key={`${problem.kind}-${index}`} className="workflowMinimapIssueText" title={text}>{text}</span>;
					})}
				</div>
			)}
		</section>
	);
}
