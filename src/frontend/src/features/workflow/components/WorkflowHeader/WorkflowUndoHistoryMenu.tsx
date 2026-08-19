import { useEffect, useRef } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { formatRelativeTime } from '@shared/utils/formatRelativeTime';
import { WorkflowUndoChangeIcon } from './WorkflowUndoChangeIcon';
import type { WorkflowUndoEntry } from '../../types/undoHistory.types';
import { undoChangeLabel } from '../../utils/workflowUndoLabel.utils';

type Props = {
	open: boolean;
	entries: WorkflowUndoEntry[];
	onClose: () => void;
	onSelect: (offset: number) => void;
};

export function WorkflowUndoHistoryMenu({ open, entries, onClose, onSelect }: Props) {
	const { t, lang } = useI18n('workflow');
	const ref = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!open) return;
		const onPointerDown = (event: PointerEvent) => {
			if (!ref.current?.contains(event.target as Node)) onClose();
		};
		const onEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose();
		};
		window.addEventListener('pointerdown', onPointerDown, true);
		window.addEventListener('keydown', onEscape);
		return () => {
			window.removeEventListener('pointerdown', onPointerDown, true);
			window.removeEventListener('keydown', onEscape);
		};
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div ref={ref} className='headerMenu undoHistoryMenu' data-testid='workflow-undo-history-menu'>
			<div className='headerMenuSection'>
				{entries.map((entry) => {
					const label = undoChangeLabel(entry.change);
					const values = {
						...label.values,
						...Object.fromEntries(Object.entries(label.valueKeys ?? {})
							.map(([variable, key]) => [variable, t(key)])),
					};
					const isCurrent = entry.offset === 0;
					return (
						<button key={entry.offset} type='button'
							// Exact clock time on hover; the row itself stays relative, which
							// is what reads best for a list of edits from this session.
							title={new Date(entry.at).toLocaleTimeString(lang)}
							className={`headerMenuItem undoHistoryItem${
								isCurrent ? ' undoHistoryItem--current' : ''}${
								entry.offset > 0 ? ' undoHistoryItem--undone' : ''}`}
							aria-current={isCurrent}
							data-testid={`workflow-undo-history-item-${entry.offset}`}
							onClick={() => {
								if (!isCurrent) onSelect(entry.offset);
								onClose();
							}}>
							<WorkflowUndoChangeIcon icon={entry.change.icon} />
							<span className='undoHistoryItemLabel'>{t(label.key, values)}</span>
							{isCurrent
								? <span className='headerMenuBadge'>{t('undoHistory.current')}</span>
								: <span className='undoHistoryItemTime'>
									{formatRelativeTime(entry.at, lang)}
								</span>}
						</button>
					);
				})}
			</div>
		</div>
	);
}
