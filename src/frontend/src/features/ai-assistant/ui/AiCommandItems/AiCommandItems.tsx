import { Command } from 'cmdk';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Icon } from '@shared/ui/primitives/Icon';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { formatElapsed, useElapsedSeconds } from '../../hooks/useElapsedSeconds';
import type { AiCommandAssist } from '../../command/useAiCommandAssist';
import { AiCommandProposalItems } from './AiCommandProposalItems';
import { AiCommandSuggestions } from './AiCommandSuggestions';
import './aiCommandItems.css';

type Props = {
	assist: AiCommandAssist;
	onRun: (phrase: string) => void;
	onEdit: (text: string) => void;
};

/** The AI group on top of the palette list (ask, thinking, proposal) and the commands suggested by meaning. */
export function AiCommandItems({ assist, onRun, onEdit }: Props) {
	const { t } = useI18n('common');
	const { state } = assist;
	const elapsed = useElapsedSeconds(state.status === 'routing' ? state.startedAt : null);
	if (!assist.canAsk) return null;

	return (
		<>
			<Command.Group heading={t('commandPalette.groups.ai')}>
				{state.status === 'idle' && (
					<Command.Item value="ai:ask" onSelect={() => void assist.ask()} onMouseDown={(event) => event.preventDefault()}
						data-testid="command-palette-ai-ask">
						<div className="cmdk-item-row">
							<span className="cmdk-item-icon aiCommandIcon"><Icon name="sparkles" size={16} /></span>
							<span className="cmdk-item-value">{t('commandPalette.ai.ask', { prompt: assist.prompt })}</span>
							<span className="cmdk-item-description">{t('commandPalette.ai.askHint')}</span>
						</div>
					</Command.Item>
				)}
				{state.status === 'routing' && (
					<Command.Item value="ai:thinking" disabled data-testid="command-palette-ai-thinking">
						<div className="cmdk-item-row">
							<span className="cmdk-item-icon"><Loading size="xs" inline /></span>
							<span className="cmdk-item-value">{t('commandPalette.ai.thinking', { elapsed: formatElapsed(elapsed) })}</span>
						</div>
					</Command.Item>
				)}
				{state.status === 'done' && <AiCommandProposalItems proposal={state.proposal} onRun={onRun} onEdit={onEdit} />}
				{state.status === 'error' && (
					<Command.Item value="ai:retry" onSelect={() => void assist.ask()} onMouseDown={(event) => event.preventDefault()}
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
