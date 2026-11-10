import { useEffect, useState } from 'react';
import { Checkbox } from '@shared/ui/primitives/Checkbox';
import { Empty } from '@shared/ui/primitives/Empty';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { ChangeHistoryEntryRow } from './ChangeHistoryEntryRow';
import type { ChangeHistoryPanelProps } from './ChangeHistoryPanel.types';
import { DrawerHeader } from '@features/workflow/components/sidebar/DrawerHeader/DrawerHeader';

/**
 * Sidebar over the in-session undo stack: every recorded change, newest first,
 * with any row jumping the canvas to that point. Distinct from HistoryPanel,
 * which restores states that were *saved* on the backend.
 */
export function ChangeHistoryPanel({ open, entries, onClose, onJumpTo }: ChangeHistoryPanelProps) {
	const { t } = useI18n('workflow');
	const [isAiOnly, setIsAiOnly] = useState(false);
	const hasAiChanges = entries.some((entry) => entry.origin === 'ai');
	const shown = isAiOnly && hasAiChanges ? entries.filter((entry) => entry.origin === 'ai') : entries;
	// A lone seed entry ("session start") is not a history worth listing.
	const hasHistory = entries.length > 1;

	useEffect(() => {
		if (!open) return;
		const onEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onEscape);
		return () => window.removeEventListener('keydown', onEscape);
	}, [open, onClose]);

	return (
		<>
			<div className={`drawerOverlay ${open ? 'drawerOverlayOpen' : ''}`} onClick={onClose} />
			<aside data-testid='workflow-change-history-panel'
				className={`rightDrawer changeHistoryDrawer ${open ? 'rightDrawerOpen' : ''}`}>
				<DrawerHeader title={t('undoHistory.title')} onClose={onClose} closeTestId='workflow-change-history-close' />
				<div className='drawerBody changeHistoryBody'>
					{hasAiChanges && (
						<div className='changeHistoryFilter'>
							<Checkbox checked={isAiOnly} onChange={setIsAiOnly} label={t('undoHistory.onlyAi')}
								testId='workflow-change-history-ai-only' />
						</div>
					)}
					{hasHistory
						? <div className='changeHistoryList'>
							{shown.map((entry) => (
								<ChangeHistoryEntryRow key={entry.offset} entry={entry}
									onSelect={onJumpTo} />
							))}
						</div>
						: <Empty className='historyEmpty' description={t('undoHistory.empty')} />}
				</div>
			</aside>
		</>
	);
}
