import { Command } from 'cmdk';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Icon } from '@shared/ui/primitives/Icon';
import { buildTestId } from '@shared/testing/testId';
import { type AiCommandProposal, editTextOf } from '../../command/commandProposal';
import { AI_ITEM } from '../../command/aiCommandItemValues';
import type { CatalogEntry } from '../../command/buildCommandCatalog';
import type { ResolvedIntent } from '../../command/intents/resolveIntent';

type Props = {
	proposal: AiCommandProposal;
	onRun: (phrase: string) => void;
	onEdit: (text: string) => void;
	onRunIntent: (resolved: ResolvedIntent) => void;
};

const keepFocus = (event: React.MouseEvent) => event.preventDefault();

function CommandRow({ entry, label, record, action }: { entry: CatalogEntry; label: string; record?: string; action: string }) {
	const { t } = useI18n('common');
	return (
		<div className="cmdk-item-row">
			<span className="cmdk-item-icon aiCommandIcon"><Icon name={entry.icon ?? 'sparkles'} size={16} /></span>
			{record ? (
				<span className="aiCommandPhrase aiCommandPhrase--record" title={label}>
					<code className="aiCommandWords">{entry.prefix}</code>
					<span className="aiCommandRecord">{record}</span>
				</span>
			) : (
				<code className="aiCommandPhrase" title={label}>{label}</code>
			)}
			{entry.effect === 'destructive' && (
				<span className="aiCommandBadge aiCommandBadge--danger">{t('commandPalette.ai.confirmFirst')}</span>
			)}
			<span className="aiCommandAction">{action}</span>
		</div>
	);
}

/** The command the AI chose: run it, pick its record, or finish it in the palette when the value is missing. */
export function AiCommandProposalItems({ proposal, onRun, onEdit, onRunIntent }: Props) {
	const { t } = useI18n('common');
	switch (proposal.kind) {
		case 'no-command':
			return (
				<Command.Item value={AI_ITEM.none} disabled data-testid="command-palette-ai-none">
					<div className="aiCommandProposal">
						<span className="aiCommandProposalTitle">{t('commandPalette.ai.noCommand')}</span>
						{proposal.reply && <span className="aiCommandReply">{proposal.reply}</span>}
					</div>
				</Command.Item>
			);
		case 'choose':
			return (
				<>
					<Command.Item value={AI_ITEM.choose} disabled data-testid="command-palette-ai-choose">
						<span className="aiCommandProposalTitle">{t('commandPalette.ai.choose', { value: proposal.argument })}</span>
					</Command.Item>
					{proposal.options.map((option) => (
						<Command.Item key={option.phrase} value={AI_ITEM.option(option.phrase)} onMouseDown={keepFocus}
							onSelect={() => onRun(option.phrase)} data-testid={buildTestId('command-palette-ai-option', option.label)}>
							<CommandRow entry={proposal.entry} label={option.label} record={option.record} action={t('commandPalette.ai.run')} />
						</Command.Item>
					))}
				</>
			);
		case 'ready':
			return (
				<>
					<Command.Item value={AI_ITEM.run} onMouseDown={keepFocus} onSelect={() => onRun(proposal.phrase)}
						data-testid="command-palette-ai-run">
						<div className="aiCommandProposal">
							<CommandRow entry={proposal.entry} label={proposal.label} record={proposal.record} action={t('commandPalette.ai.run')} />
							{proposal.reply && <span className="aiCommandReply">{proposal.reply}</span>}
						</div>
					</Command.Item>
					<Command.Item value={AI_ITEM.edit} onMouseDown={keepFocus} onSelect={() => onEdit(editTextOf(proposal))}
						data-testid="command-palette-ai-edit">
						<div className="cmdk-item-row">
							<span className="cmdk-item-icon"><Icon name="edit" size={16} /></span>
							<span className="cmdk-item-value">{t('commandPalette.ai.edit')}</span>
						</div>
					</Command.Item>
				</>
			);
		case 'action':
			return (
				<Command.Item value={AI_ITEM.run} onMouseDown={keepFocus} onSelect={() => onRunIntent(proposal.resolved)}
					data-testid="command-palette-ai-run">
					<div className="aiCommandProposal">
						<CommandRow entry={proposal.entry} label={proposal.entry.phrase} action={t('commandPalette.ai.run')} />
						{proposal.reply && <span className="aiCommandReply">{proposal.reply}</span>}
					</div>
				</Command.Item>
			);
		case 'not-found':
		case 'needs-value':
			return (
				<Command.Item value={AI_ITEM.finish} onMouseDown={keepFocus} onSelect={() => onEdit(editTextOf(proposal))}
					data-testid="command-palette-ai-finish">
					<div className="aiCommandProposal">
						<CommandRow entry={proposal.entry} label={proposal.entry.phrase} action={t('commandPalette.ai.finish')} />
						<span className="aiCommandHint">
							{proposal.kind === 'not-found'
								? t('commandPalette.ai.notFound', { value: proposal.argument })
								: t('commandPalette.ai.needsValue')}
						</span>
					</div>
				</Command.Item>
			);
		default: {
			const _exhaustive: never = proposal;
			return _exhaustive;
		}
	}
}
