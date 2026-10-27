import { Command } from 'cmdk';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Icon } from '@shared/ui/primitives/Icon';
import { type AiCommandProposal, editTextOf } from '../../command/commandProposal';

type Props = {
	proposal: AiCommandProposal;
	onRun: (phrase: string) => void;
	onEdit: (text: string) => void;
};

const keepFocus = (event: React.MouseEvent) => event.preventDefault();

/** The command the AI chose: run it, or finish it in the palette when a value is missing or ambiguous. */
export function AiCommandProposalItems({ proposal, onRun, onEdit }: Props) {
	const { t } = useI18n('common');
	if (proposal.kind === 'no-command') {
		return (
			<Command.Item value="ai:none" disabled data-testid="command-palette-ai-none">
				<div className="aiCommandProposal">
					<span className="aiCommandProposalTitle">{t('commandPalette.ai.noCommand')}</span>
					{proposal.reply && <span className="aiCommandReply">{proposal.reply}</span>}
				</div>
			</Command.Item>
		);
	}
	const isReady = proposal.kind === 'ready';
	const hint = {
		ready: '',
		choose: t('commandPalette.ai.choose', { value: proposal.kind === 'choose' ? proposal.argument : '' }),
		'not-found': t('commandPalette.ai.notFound', { value: proposal.kind === 'not-found' ? proposal.argument : '' }),
		'needs-value': t('commandPalette.ai.needsValue'),
	}[proposal.kind];
	return (
		<>
			<Command.Item value={isReady ? 'ai:run' : 'ai:finish'} onMouseDown={keepFocus}
				onSelect={() => (isReady ? onRun(proposal.phrase) : onEdit(editTextOf(proposal)))}
				data-testid={isReady ? 'command-palette-ai-run' : 'command-palette-ai-finish'}>
				<div className="aiCommandProposal">
					<div className="cmdk-item-row">
						<span className="cmdk-item-icon aiCommandIcon"><Icon name={proposal.entry.icon ?? 'sparkles'} size={16} /></span>
						<code className="aiCommandPhrase">{isReady ? proposal.label : proposal.entry.phrase}</code>
						{proposal.entry.effect === 'destructive' && (
							<span className="aiCommandBadge aiCommandBadge--danger">{t('commandPalette.ai.confirmFirst')}</span>
						)}
						<span className="aiCommandAction">{isReady ? t('commandPalette.ai.run') : t('commandPalette.ai.finish')}</span>
					</div>
					{hint && <span className="aiCommandHint">{hint}</span>}
					{/* Said before the value was looked up: "will be deleted" next to "nothing found" would mislead. */}
					{isReady && proposal.reply && <span className="aiCommandReply">{proposal.reply}</span>}
				</div>
			</Command.Item>
			{isReady && (
				<Command.Item value="ai:edit" onMouseDown={keepFocus} onSelect={() => onEdit(proposal.phrase)}
					data-testid="command-palette-ai-edit">
					<div className="cmdk-item-row">
						<span className="cmdk-item-icon"><Icon name="edit" size={16} /></span>
						<span className="cmdk-item-value">{t('commandPalette.ai.edit')}</span>
					</div>
				</Command.Item>
			)}
		</>
	);
}
