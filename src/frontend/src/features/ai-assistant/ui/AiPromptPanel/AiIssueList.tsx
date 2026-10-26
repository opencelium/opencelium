import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { AiWorkflowIssue } from '../../model/aiGateway.types';
import type { DslPreview } from '../../utils/dslPreview.utils';

type Props = {
	issues: AiWorkflowIssue[];
	preview: DslPreview;
};

export function AiIssueList({ issues, preview }: Props) {
	const { t } = useI18n('workflow');
	if (issues.length === 0) return null;

	const titleOf = (stepId: string) => {
		const label = preview.stepLabel(stepId);
		if (label === 'loop') return t('ai.result.loop');
		if (label === 'if') return t('ai.result.if');
		return label ?? stepId;
	};

	return (
		<section className="aiPanelSection" data-testid="ai-panel-issues">
			<div className="aiPanelSectionTitle">{t('ai.result.review', { count: issues.length })}</div>
			<ul className="aiIssueList">
				{issues.map((issue, index) => (
					<li key={`${issue.stepId}-${index}`} className={`aiIssue aiIssue--${issue.severity}`}>
						<span className="aiIssueDot" aria-hidden />
						<span className="aiIssueBody">
							{issue.stepId && <span className="aiIssueTitle">{titleOf(issue.stepId)}</span>}
							<span className="aiIssueText">{issue.message}</span>
						</span>
					</li>
				))}
			</ul>
		</section>
	);
}
