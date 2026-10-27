import { Command } from 'cmdk';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Icon } from '@shared/ui/primitives/Icon';
import { buildTestId } from '@shared/testing/testId';
import type { CatalogEntry } from '../../command/buildCommandCatalog';

type Props = {
	entries: CatalogEntry[];
	onRun: (phrase: string) => void;
	onEdit: (text: string) => void;
};

/** Commands close in meaning to the typed text; one that needs a value is put into the palette to pick it. */
export function AiCommandSuggestions({ entries, onRun, onEdit }: Props) {
	const { t } = useI18n('common');
	if (entries.length === 0) return null;
	return (
		<Command.Group heading={t('commandPalette.groups.aiSuggested')}>
			{entries.map((entry) => (
				<Command.Item key={entry.id} value={`ai-suggested:${entry.id}`} onMouseDown={(event) => event.preventDefault()}
					onSelect={() => (entry.argument ? onEdit(`${entry.prefix} `) : onRun(entry.prefix))}
					data-testid={buildTestId('command-palette-ai-suggested', entry.prefix)}>
					<div className="cmdk-item-row">
						<span className="cmdk-item-icon"><Icon name={entry.icon ?? 'command'} size={16} /></span>
						<span className="cmdk-item-value" title={entry.phrase}>
							{entry.prefix}
							{entry.argument && <span className="aiCommandPlaceholder"> &lt;{entry.argument.name}&gt;</span>}
						</span>
						{entry.descriptionKey && (
							<span className="cmdk-item-description">{t(entry.descriptionKey as never)}</span>
						)}
					</div>
				</Command.Item>
			))}
		</Command.Group>
	);
}
