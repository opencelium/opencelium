import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { RunExplanation } from '../../model/aiGateway.types';

/** What went wrong, why, and what to change, in the words of the AI. */
export function AiRunExplanation({ explanation }: { explanation: RunExplanation }) {
	const { t } = useI18n('workflow');
	return (
		<div className="aiRunExplanation" data-testid="ai-run-explanation">
			<p className="aiRunSummary">{explanation.summary}</p>
			<p className="aiRunCause">{explanation.cause}</p>
			{explanation.fix.length > 0 && (
				<>
					<div className="aiRunLabel">{t('ai.run.howToFix')}</div>
					<ul className="aiRunFixList">
						{explanation.fix.map((step) => <li key={step}>{step}</li>)}
					</ul>
				</>
			)}
		</div>
	);
}
