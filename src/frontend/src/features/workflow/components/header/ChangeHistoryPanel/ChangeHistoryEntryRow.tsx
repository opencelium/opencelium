import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Icon } from '@shared/ui/primitives/Icon';
import { formatRelativeTime } from '@shared/utils/formatRelativeTime';
import { ChangeHistoryIcon } from './ChangeHistoryIcon';
import type { WorkflowUndoEntry } from '../../../types/undoHistory.types';
import { isUndoChangeDeletion, undoChangeLabel } from '../../../utils/workflowUndoLabel.utils';

type Props = {
	entry: WorkflowUndoEntry;
	onSelect: (offset: number) => void;
};

export function ChangeHistoryEntryRow({ entry, onSelect }: Props) {
	const { t, lang } = useI18n('workflow');
	const label = undoChangeLabel(entry.change);
	const values = {
		...label.values,
		...Object.fromEntries(Object.entries(label.valueKeys ?? {})
			.map(([variable, key]) => [variable, t(key)])),
	};
	const isCurrent = entry.offset === 0;
	const isDeletion = isUndoChangeDeletion(entry.change);

	return (
		<button type='button'
			// Exact clock time on hover; the row itself stays relative, which is what
			// reads best for a list of edits from this session.
			title={new Date(entry.at).toLocaleTimeString(lang)}
			className={`changeHistoryItem${isCurrent ? ' changeHistoryItem--current' : ''}${
				entry.offset > 0 ? ' changeHistoryItem--undone' : ''}${
				isDeletion ? ' changeHistoryItem--delete' : ''}`}
			aria-current={isCurrent}
			data-testid={`workflow-change-history-item-${entry.offset}`}
			onClick={() => { if (!isCurrent) onSelect(entry.offset); }}>
			{/* A deletion takes over the icon column: what it removed is no longer on
			    the canvas, so its artwork says less than the trash glyph does. The
			    glyph also keeps the row marked in greyscale, where the tint is lost. */}
			{isDeletion
				? <span className='changeHistoryIcon'>
					<Icon name='delete' size={14} color='danger' />
				</span>
				: <ChangeHistoryIcon icon={entry.change.icon} />}
			<span className='changeHistoryItemLabel'>{t(label.key, values)}</span>
			{isCurrent
				? <span className='headerMenuBadge'>{t('undoHistory.current')}</span>
				: <span className='changeHistoryItemTime'>
					{formatRelativeTime(entry.at, lang)}
				</span>}
		</button>
	);
}
