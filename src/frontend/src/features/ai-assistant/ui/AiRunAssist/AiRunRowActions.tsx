import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import type { RunFailureAssist } from '../../run/useRunFailureAssist';

/** Show step and Explain on the failing element's row; Explain asks once, then shows or hides the answer. */
export function AiRunRowActions({ assist }: { assist: RunFailureAssist }) {
	const { t } = useI18n('workflow');
	const { failedNodeId, state, isShown } = assist;
	const showStep = () => failedNodeId && workflowCommandBridgeStore.getState().centerOnNode(failedNodeId);
	const toggleExplanation = () => {
		if (state.status === 'idle') void assist.explain();
		else if (isShown) assist.hide();
		else assist.show();
	};
	return (
		<>
			{failedNodeId && (
				<Button iconLeft="external-link" onClick={showStep} testId="ai-run-show-step">{t('ai.run.showStep')}</Button>
			)}
			<Button type="primary" iconLeft="sparkles" onClick={toggleExplanation} loading={state.status === 'explaining'}
				testId="ai-run-explain">
				{t('ai.run.explain')}
			</Button>
		</>
	);
}
