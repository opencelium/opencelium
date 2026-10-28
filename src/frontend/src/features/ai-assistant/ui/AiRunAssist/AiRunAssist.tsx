import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { isAiConfigured, useGetAiHealthQuery } from '../../api/aiApi';
import { type RunAssistTarget, useRunFailureAssist } from '../../run/useRunFailureAssist';
import { AiRunExplanation } from './AiRunExplanation';
import { AiRunFixProposal } from './AiRunFixProposal';
import '../../styles/ai-run.css';

type Props = RunAssistTarget & {
	/** A running test locks the graph: a fix can be prepared but not applied. */
	isLocked: boolean;
};

const bodyText = (body: unknown) => (typeof body === 'string' ? body : JSON.stringify(body ?? '', null, 2));

/** "Explain" and "Fix with AI" under a failed test run; hidden while the AI gateway is not reachable. */
export function AiRunAssist({ isLocked, ...target }: Props) {
	const { t } = useI18n('workflow');
	const isConfigured = isAiConfigured();
	const health = useGetAiHealthQuery(undefined, { skip: !isConfigured });
	const assist = useRunFailureAssist(target);
	const { state } = assist;
	const isAvailable = isConfigured && health.data?.ollama.reachable === true && health.data.workflowModel.available;
	if (!isAvailable || !assist.canAssist) return null;

	const explanation = 'explanation' in state ? state.explanation : null;
	const showStep = () => assist.failedNodeId && workflowCommandBridgeStore.getState().centerOnNode(assist.failedNodeId);
	const currentBody = state.status === 'fix'
		? bodyText(target.nodes.find((node) => node.id === state.target.nodeId)?.data.methodConfig?.body ?? state.target.methodConfig.body)
		: '';

	return (
		<section className="aiRunAssist" data-testid="ai-run-assist">
			<div className="aiRunActions">
				{!explanation && (
					<Button iconLeft="sparkles" onClick={() => void assist.explain()} loading={state.status === 'explaining'}
						testId="ai-run-explain">{t('ai.run.explain')}</Button>
				)}
				{explanation?.isRequestFixable && state.status !== 'fix' && state.status !== 'applied' && (
					<Button iconLeft="sparkles" type="primary" onClick={() => void assist.fix()} loading={state.status === 'fixing'}
						testId="ai-run-fix-button">{t('ai.run.fix')}</Button>
				)}
				{assist.failedNodeId && <Button type="text" onClick={showStep} testId="ai-run-show-step">{t('ai.run.showStep')}</Button>}
				{(state.status === 'explaining' || state.status === 'fixing') && (
					<span className="aiTemplateNote">{t('ai.run.working')}</span>
				)}
			</div>
			{state.status === 'error' && <div className="aiRunError" data-testid="ai-run-error">{t('ai.run.failed')}</div>}
			{explanation && <AiRunExplanation explanation={explanation} />}
			{state.status === 'fix' && (
				<AiRunFixProposal fix={state.fix} currentBody={currentBody} isLocked={isLocked} onApply={assist.apply} onDiscard={assist.discard} />
			)}
			{state.status === 'applied' && <div className="aiTemplateNote" data-testid="ai-run-applied">{t('ai.run.appliedHint')}</div>}
		</section>
	);
}
