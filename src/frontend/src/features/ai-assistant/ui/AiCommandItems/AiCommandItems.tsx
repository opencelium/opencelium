import { Command } from 'cmdk';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Icon } from '@shared/ui/primitives/Icon';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import type { AiCommandAssist } from '../../command/useAiCommandAssist';
import type { ResolvedIntent } from '../../command/intents/resolveIntent';
import { AI_ITEM } from '../../command/aiCommandItemValues';
import { AiCommandProposalItems } from './AiCommandProposalItems';
import { AiCommandSuggestions } from './AiCommandSuggestions';
import { AiExpectedTime } from '../AiExpectedTime/AiExpectedTime';
import { useAssistantStore } from '../../assistant/assistantStore';
import './aiCommandItems.css';

type Props = {
	assist: AiCommandAssist;
	onRun: (phrase: string) => void;
	onEdit: (text: string) => void;
	onRunIntent: (resolved: ResolvedIntent) => void;
};

/** The AI group on top of the palette list (ask, thinking, proposal) and the commands suggested by meaning. */
export function AiCommandItems({ assist, onRun, onEdit, onRunIntent }: Props) {
	const { t } = useI18n('common');
	const { state } = assist;
	const openAssistant = useAssistantStore((store) => store.open);
	if (!assist.isVisible) return null;
	const askAssistant = (question: string) => {
		openAssistant(question);
		assist.reset();
		onEdit('');
	};

	return (
		<>
			<Command.Group heading={t('commandPalette.groups.ai')}>
				{state.status === 'idle' && (
					<Command.Item value={AI_ITEM.ask} onSelect={() => void assist.ask()} onMouseDown={(event) => event.preventDefault()}
						data-testid="command-palette-ai-ask">
						<div className="cmdk-item-row">
							<span className="cmdk-item-icon aiCommandIcon"><Icon name="sparkles" size={16} /></span>
							<span className="cmdk-item-value">{t('commandPalette.ai.ask', { prompt: assist.prompt })}</span>
							<span className="cmdk-item-description">{t('commandPalette.ai.askHint')}</span>
						</div>
					</Command.Item>
				)}
				{state.status === 'routing' && (
					<Command.Item value={AI_ITEM.thinking} disabled data-testid="command-palette-ai-thinking">
						<div className="cmdk-item-row">
							<span className="cmdk-item-icon"><Loading size="xs" inline /></span>
							<span className="cmdk-item-value">{t('commandPalette.ai.thinking')}</span>
							<span className="cmdk-item-description"><AiExpectedTime feature="command" startedAt={state.startedAt} /></span>
						</div>
					</Command.Item>
				)}
				{state.status === 'done' && state.isQuestion && (
					<Command.Item value={AI_ITEM.askAssistant} onSelect={() => askAssistant(state.prompt)} onMouseDown={(event) => event.preventDefault()}
						data-testid="command-palette-ai-ask-assistant">
						<div className="cmdk-item-row">
							<span className="cmdk-item-icon aiCommandIcon"><Icon name="help" size={16} /></span>
							<span className="cmdk-item-value">{t('assistant.askInPalette', { question: state.prompt })}</span>
						</div>
					</Command.Item>
				)}
				{state.status === 'done' && !(state.isQuestion && state.proposal.kind === 'no-command') && (
					<AiCommandProposalItems proposal={state.proposal} onRun={onRun} onEdit={onEdit} onRunIntent={onRunIntent} />
				)}
				{state.status === 'error' && (
					<Command.Item value={AI_ITEM.retry} onSelect={() => void assist.ask()} onMouseDown={(event) => event.preventDefault()}
						data-testid="command-palette-ai-retry">
						<div className="cmdk-item-row">
							<span className="cmdk-item-icon aiCommandIcon--error"><Icon name="warning" size={16} /></span>
							<span className="cmdk-item-value">
								{t(state.error === 'unreachable' ? 'commandPalette.ai.unreachable' : 'commandPalette.ai.failed')}
							</span>
							<span className="cmdk-item-description">{t('commandPalette.ai.retry')}</span>
						</div>
					</Command.Item>
				)}
			</Command.Group>
			<AiCommandSuggestions entries={assist.suggestions} onRun={onRun} onEdit={onEdit} />
		</>
	);
}
