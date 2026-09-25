import { CloseOutlined } from '@ant-design/icons';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { HistoryPanelTimeline } from './HistoryPanelTimeline';
import { useHistoryPanelState } from './useHistoryPanelState';
import type { HistoryPanelProps } from './HistoryPanel.types';
import { useHistoryPanelActions } from './useHistoryPanelActions';

export function HistoryPanel({ open, items, onClose, onDeleteVersion, onDownloadTemplate, onSelectVersion, onSaveComment, hasUnsavedChanges = false, selectedId, onSelectedIdChange }: HistoryPanelProps) {
	const state = useHistoryPanelState({ open, items, onClose, selectedId, onSelectedIdChange });
	const { t } = useI18n('workflow');
	const actions = useHistoryPanelActions(state, { onDeleteVersion,
		onDownloadTemplate, onSelectVersion, onSaveComment, hasUnsavedChanges });

	return (
		<>
			<div
				className={`drawerOverlay ${open ? 'drawerOverlayOpen' : ''}`}
				onClick={onClose}
			/>
			<aside
				ref={state.panelRef}
				data-testid='workflow-history-panel'
				className={`rightDrawer historyPanelDrawer ${open ? 'rightDrawerOpen' : ''}`}
			>
				<div className='drawerHeader'>
					<div className='drawerTitle'>{t('history.title')}</div>
					<button className='iconButton' type='button' onClick={onClose}>
						<CloseOutlined />
					</button>
				</div>
				<div className='drawerBody historyBody'>
					<div className='historyScroll'>
						<HistoryPanelTimeline state={state}
							downloadingSnapshotId={actions.downloadingSnapshotId}
							onSelect={actions.selectVersion}
							onToggleExpand={actions.toggleExpandedComment}
							onSave={actions.saveComment}
							onDownloadTemplate={actions.downloadTemplate}
							onDelete={actions.requestDelete} />
					</div>
				</div>
			</aside>
		</>
	);
}
