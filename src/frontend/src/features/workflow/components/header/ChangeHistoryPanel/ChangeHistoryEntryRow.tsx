import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Icon } from '@shared/ui/primitives/Icon';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { formatRelativeTime } from '@shared/utils/formatRelativeTime';
import { ChangeHistoryIcon } from './ChangeHistoryIcon';
import type { WorkflowUndoEntry } from '../../../types/undoHistory.types';
import { isUndoChangeDeletion, undoChangeLabel } from '../../../utils/workflowUndoLabel.utils';

type Props = {
	entry: WorkflowUndoEntry;
	onSelect: (offset: number) => void;
	onShowNode?: (nodeId: string) => void;
};

export function ChangeHistoryEntryRow({ entry, onSelect, onShowNode }: Props) {
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
			onClick={() => {
				if (!isCurrent) onSelect(entry.offset);
				// Also for the current entry: going there changes nothing, but showing where it happened still helps.
				const { nodeId } = entry.change;
				if (nodeId) onShowNode?.(nodeId);
			}}>
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
	);
}
