import { message } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { copyToClipboard } from '@shared/utils/copyToClipboard';
import { Empty } from '@shared/ui/primitives/Empty';
import { HistoryTimelineRow } from '../HistoryTimelineRow/HistoryTimelineRow';
import type { useHistoryPanelState } from './useHistoryPanelState';

type Props = {
	state: ReturnType<typeof useHistoryPanelState>;
	downloadingSnapshotId: string | null;
	onSelect: (id: string) => void;
	onToggleExpand: (id: string) => void;
	onSave: (id: string) => void;
	onDownloadTemplate: (snapshotId: string) => void;
	onDelete: (id: string) => void;
};

export function HistoryPanelTimeline({ state, downloadingSnapshotId, onSelect,
	onToggleExpand, onSave, onDownloadTemplate, onDelete }: Props) {
	const { t } = useI18n('workflow');
	if (!state.rows.length) {
		return <Empty className='historyEmpty' description={t('history.empty')} />;
	}

	return (
		<div className='historyTimeline'>
			<div className='historyTimelineLine' />
			{state.rows.map((row) => (
				<HistoryTimelineRow
					key={row.key}
					row={row}
					selectedId={state.selectedId}
					activeId={state.activeId}
					downloadingSnapshotId={downloadingSnapshotId}
					hoveredCommentId={state.hoveredCommentId}
					expandedCommentId={state.expandedCommentId}
					commentValue={row.kind === 'item' ? (state.comments[row.item.id] ?? '') : ''}
					expandedWidth={row.kind === 'item' ? (state.expandedMetrics[row.item.id]?.width ?? 320) : 320}
					expandedShiftLeft={row.kind === 'item' ? (state.expandedMetrics[row.item.id]?.shiftLeft ?? 0) : 0}
					menuOpen={row.kind === 'item' && state.menuId === row.item.id}
					menuRef={state.menuRef}
					onSelect={onSelect}
					onHover={state.setHoveredCommentId}
					onToggleExpand={onToggleExpand}
					onFocus={state.setActiveId}
					onBlur={(id) => state.setActiveId((current) =>
						current === id && state.expandedCommentId !== id ? null : current)}
					onChangeComment={(id, value) => state.setComments((current) => ({ ...current, [id]: value }))}
					onSave={onSave}
					onToggleMenu={(id) => state.setMenuId((current) => current === id ? null : id)}
					onCopySnapshot={async (snapshotId) => {
						const copied = await copyToClipboard(snapshotId);
						state.setMenuId(null);
						if (copied) message.success(t('messages.copySnapshotIdSuccess'));
					}}
					onDownloadTemplate={onDownloadTemplate}
					onDelete={onDelete}
					setCommentRef={(id, element) => { state.commentRefs.current[id] = element; }}
				/>
			))}
		</div>
	);
}
