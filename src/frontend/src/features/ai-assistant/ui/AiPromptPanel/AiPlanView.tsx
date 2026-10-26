import type { KeyboardEvent, RefObject } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Textarea } from '@shared/ui/primitives/Textarea';
import type { AiWorkflowGeneration } from '../../hooks/useAiWorkflowGeneration';
import type { AiConnectorChoice } from '../../utils/aiConnectors.utils';
import { AiGeneratingProgress } from './AiGeneratingProgress';
import { AiGenerationErrorAlert } from './AiGenerationErrorAlert';
import { AiRequestSummary } from './AiRequestSummary';

type Props = {
	generation: AiWorkflowGeneration;
	choices: AiConnectorChoice[];
	planRef: RefObject<HTMLTextAreaElement | null>;
	onPlanKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
};

/** The plan the model proposed, editable before anything is built. */
export function AiPlanView({ generation, choices, planRef, onPlanKeyDown }: Props) {
	const { t } = useI18n('workflow');
	const { state, prompt, planText, setPlanText, connectors, backToPrompt, retry } = generation;
	const byId = (connectorId: number | null) => choices.find((choice) => choice.connectorId === connectorId);
	const isBuilding = state.status === 'generating';

	return (
		<div className="aiPanelForm" data-testid="ai-panel-plan">
			<AiRequestSummary prompt={prompt.trim()} from={byId(connectors.fromId)} to={byId(connectors.toId)}
				actionLabel={t('ai.actions.editPrompt')} actionTestId="ai-panel-edit-prompt" onAction={backToPrompt} />

			<section className="aiPanelSection">
				<div className="aiPanelSectionTitle aiPanelSectionTitle--split">
					<span>{t('ai.plan.title')}</span>
					{state.status === 'plan' && state.pattern === 'sync' && (
						<span className="aiPlanPattern" data-testid="ai-panel-plan-pattern">{t('ai.plan.patternSync')}</span>
					)}
				</div>
				<p className="aiPlanHint">{t('ai.plan.hint')}</p>
				<div className="aiPlanEditor" onKeyDown={onPlanKeyDown}>
					<Textarea value={planText} disabled={isBuilding} textareaRef={planRef} testId="ai-panel-plan-text"
						onChange={(event) => setPlanText(event.target.value)} />
				</div>
				<div className="aiPromptMeta">
					<span><kbd>Ctrl</kbd> + <kbd>Enter</kbd> {t('ai.plan.shortcutHint')}</span>
				</div>
			</section>

			{isBuilding && <AiGeneratingProgress stage="build" startedAt={state.startedAt} />}
			{state.status === 'error' && state.stage === 'build' && (
				<AiGenerationErrorAlert failure={state.failure} detail={state.message} onRetry={retry} />
			)}
		</div>
	);
}
