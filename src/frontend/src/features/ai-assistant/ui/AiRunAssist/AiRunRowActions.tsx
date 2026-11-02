import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import type { RunFailureAssist } from '../../run/useRunFailureAssist';

/**
 * Fix with AI and Explain on the failing element's row. Fix goes straight to a reviewed proposal; Explain asks once,
 * then shows or hides the answer.
 */
export function AiRunRowActions({ assist }: { assist: RunFailureAssist }) {
	const { t } = useI18n('workflow');
	const { state, isShown, canFix } = assist;
	const toggleExplanation = () => {
		// A direct fix leaves no explanation to toggle; an open proposal is toggled rather than replaced.
		const hasAnswer = state.status === 'fix' || ('explanation' in state && state.explanation !== null);
		if (!hasAnswer) void assist.explain();
		else if (isShown) assist.hide();
		else assist.show();
	};
	return (
		<>
			{canFix && (
				<Button type="primary" iconLeft="sparkles" onClick={() => void assist.fix()} loading={state.status === 'fixing'}
					disabled={state.status === 'explaining'} testId="ai-run-fix-row">
					{t('ai.run.fix')}
				</Button>
			)}
			<Button type={canFix ? 'default' : 'primary'} iconLeft="sparkles" onClick={toggleExplanation}
				loading={state.status === 'explaining'} disabled={state.status === 'fixing'} testId="ai-run-explain">
				{t('ai.run.explain')}
			</Button>
		</>
	);
}
