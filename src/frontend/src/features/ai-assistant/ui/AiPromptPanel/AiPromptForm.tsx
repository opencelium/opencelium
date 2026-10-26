import type { KeyboardEvent, RefObject } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Textarea } from '@shared/ui/primitives/Textarea';
import { Icon } from '@shared/ui/primitives/Icon';
import type { AiWorkflowGeneration } from '../../hooks/useAiWorkflowGeneration';
import { AI_PROMPT_MAX_LENGTH } from '../../model/aiPanelState';
import type { AiConnectorChoice } from '../../utils/aiConnectors.utils';
import { AiConnectorSelect } from './AiConnectorSelect';
import { AiExamplePrompts } from './AiExamplePrompts';
import { AiGeneratingProgress } from './AiGeneratingProgress';
import { AiGenerationErrorAlert } from './AiGenerationErrorAlert';

type Props = {
	generation: AiWorkflowGeneration;
	choices: AiConnectorChoice[];
	promptRef: RefObject<HTMLTextAreaElement | null>;
	onPromptKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
};

export function AiPromptForm({ generation, choices, promptRef, onPromptKeyDown }: Props) {
	const { t } = useI18n('workflow');
	const { connectors, setConnectors, prompt, setPrompt, state, generate } = generation;
	const isLocked = state.status === 'generating';
	const titleOf = (connectorId: number | null) => choices.find((choice) => choice.connectorId === connectorId)?.title;

	return (
		<div className="aiPanelForm">
			<section className="aiPanelSection">
				<div className="aiPanelSectionTitle">{t('ai.connectors.title')}</div>
				<div className="aiConnectorRow">
					<AiConnectorSelect label={t('ai.connectors.from')} value={connectors.fromId} choices={choices}
						disabled={isLocked} testId="ai-panel-from"
						onChange={(fromId) => setConnectors({ ...connectors, fromId })} />
					<span className="aiConnectorArrow" aria-hidden>
						<Icon name="arrow-right" size={14} color="inherit" />
					</span>
					<AiConnectorSelect label={t('ai.connectors.to')} value={connectors.toId} choices={choices}
						disabled={isLocked} testId="ai-panel-to"
						onChange={(toId) => setConnectors({ ...connectors, toId })} />
				</div>
			</section>

			<section className="aiPanelSection">
				<div className="aiPanelSectionTitle">{t('ai.prompt.title')}</div>
				<div className="aiPrompt" onKeyDown={onPromptKeyDown}>
					<Textarea value={prompt} placeholder={t('ai.prompt.placeholder')} disabled={isLocked}
						textareaRef={promptRef} testId="ai-panel-prompt"
						onChange={(event) => setPrompt(event.target.value)} />
				</div>
				<div className="aiPromptMeta">
					<span><kbd>Ctrl</kbd> + <kbd>Enter</kbd> {t('ai.prompt.shortcutHint')}</span>
					<span>{t('ai.prompt.counter', { count: prompt.length, max: AI_PROMPT_MAX_LENGTH })}</span>
				</div>
			</section>

			{state.status === 'idle' && (
				<AiExamplePrompts fromTitle={titleOf(connectors.fromId)} toTitle={titleOf(connectors.toId)}
					onPick={(text) => {
						setPrompt(text);
						promptRef.current?.focus();
					}} />
			)}
			{state.status === 'generating' && <AiGeneratingProgress startedAt={state.startedAt} />}
			{state.status === 'error' && (
				<AiGenerationErrorAlert failure={state.failure} detail={state.message} onRetry={() => void generate()} />
			)}
		</div>
	);
}
