import { useEffect } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Empty } from '@shared/ui/primitives/Empty';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { WorkflowIssue, WorkflowProblemSeverity } from './workflowProblems';
import type { WorkflowIssueGroups } from './useWorkflowIssues';
import { useWorkflowProblemText } from './useWorkflowProblemText';

type Props = {
	open: boolean;
	issues: WorkflowIssueGroups;
	onClose: () => void;
	onSelectNode: (nodeId: string) => void;
};

const GROUPS: ReadonlyArray<{ severity: WorkflowProblemSeverity; key: keyof WorkflowIssueGroups }> = [
	{ severity: 'error', key: 'errors' },
	{ severity: 'warning', key: 'warnings' },
	{ severity: 'notice', key: 'notices' },
];

type GroupProps = {
	severity: WorkflowProblemSeverity;
	issues: WorkflowIssue[];
	onSelectNode: (nodeId: string) => void;
};

function ProblemGroup({ severity, issues, onSelectNode }: GroupProps) {
	const { t } = useI18n('workflow');
	const describe = useWorkflowProblemText();
	return (
		<section className="workflowProblemsGroup" data-testid={`workflow-problems-group-${severity}`}>
			<div className="workflowProblemsGroupTitle">{t(`problems.groups.${severity}`, { count: issues.length })}</div>
			{issues.map((issue) => (
				<button key={issue.nodeId} type="button" onClick={() => onSelectNode(issue.nodeId)}
					className={`workflowProblemsItem workflowProblemsItem--${severity}`}
					data-testid={`workflow-problems-item-${issue.nodeId}`}>
					<span className="workflowProblemsItemDot" aria-hidden />
					<span className="workflowProblemsItemBody">
						<span className="workflowProblemsItemTitle">{issue.title}</span>
						{issue.problems.map((problem, index) => (
							<span key={`${problem.kind}-${index}`} className="workflowProblemsItemText">{describe(problem)}</span>
						))}
					</span>
				</button>
			))}
		</section>
	);
}

/** Every problem on the graph in one list, grouped by what it means for saving. */
export function WorkflowProblemsPanel({ open, issues, onClose, onSelectNode }: Props) {
	const { t } = useI18n('workflow');
	const isEmpty = GROUPS.every(({ key }) => issues[key].length === 0);

	useEffect(() => {
		if (!open) return;
		const onEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onEscape);
		return () => window.removeEventListener('keydown', onEscape);
	}, [open, onClose]);

	return (
		<>
			<div className={`drawerOverlay ${open ? 'drawerOverlayOpen' : ''}`} onClick={onClose} />
			<aside data-testid="workflow-problems-panel"
				className={`rightDrawer workflowProblemsDrawer ${open ? 'rightDrawerOpen' : ''}`}>
				<div className="drawerHeader">
					<div className="drawerTitle">{t('problems.title')}</div>
					<Tooltip content={t('problems.close')}>
						<IconButton type="text" iconProps={{ name: 'close' }} onClick={onClose}
							testId="workflow-problems-close" />
					</Tooltip>
				</div>
				<div className="drawerBody workflowProblemsBody">
					{isEmpty
						? <Empty description={t('problems.empty')} />
						: GROUPS.map(({ severity, key }) => issues[key].length > 0 && (
							<ProblemGroup key={severity} severity={severity} issues={issues[key]}
								onSelectNode={onSelectNode} />
						))}
				</div>
			</aside>
		</>
	);
}
