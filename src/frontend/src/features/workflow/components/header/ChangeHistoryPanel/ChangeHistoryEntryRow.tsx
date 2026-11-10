import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Icon } from '@shared/ui/primitives/Icon';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
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
	const isAi = entry.origin === 'ai';
	// An AI change already undone (offset > 0) has nothing left to undo.
	const canUndoAi = isAi && entry.offset <= 0;

	return (
		<div className='changeHistoryRow'>
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
				{isAi && (
					<Tooltip content={t('undoHistory.byAi')}>
						<span className='changeHistoryAiBadge' data-testid={`workflow-change-history-ai-${entry.offset}`}>
							<Icon name='sparkles' size={12} color='primary' />
						</span>
					</Tooltip>
				)}
				{isCurrent
					? <span className='headerMenuBadge'>{t('undoHistory.current')}</span>
					: <span className='changeHistoryItemTime'>
						{formatRelativeTime(entry.at, lang)}
					</span>}
			</button>
			{canUndoAi && (
				// The history is linear: going back to before this change also takes back what came after it.
				<Tooltip content={t('undoHistory.undoAi')}>
					<IconButton type='text' size='xs' iconProps={{ name: 'undo' }} onClick={() => onSelect(entry.offset - 1)}
						testId={`workflow-change-history-undo-${entry.offset}`} />
				</Tooltip>
			)}
		</div>
	);
}
