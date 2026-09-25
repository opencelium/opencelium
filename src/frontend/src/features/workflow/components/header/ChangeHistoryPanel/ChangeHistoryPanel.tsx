import { CloseOutlined } from '@ant-design/icons';
import { useEffect } from 'react';
import { Empty } from '@shared/ui/primitives/Empty';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { ChangeHistoryEntryRow } from './ChangeHistoryEntryRow';
import type { ChangeHistoryPanelProps } from './ChangeHistoryPanel.types';

/**
 * Sidebar over the in-session undo stack: every recorded change, newest first,
 * with any row jumping the canvas to that point. Distinct from HistoryPanel,
 * which restores states that were *saved* on the backend.
 */
export function ChangeHistoryPanel({ open, entries, onClose, onJumpTo }: ChangeHistoryPanelProps) {
	const { t } = useI18n('workflow');
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
				<div className='drawerHeader'>
					<div className='drawerTitle'>{t('undoHistory.title')}</div>
					<button className='iconButton' type='button' onClick={onClose}
						data-testid='workflow-change-history-close'>
						<CloseOutlined />
					</button>
				</div>
				<div className='drawerBody changeHistoryBody'>
					{hasHistory
						? <div className='changeHistoryList'>
							{entries.map((entry) => (
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
