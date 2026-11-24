import type { MouseEvent } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useOpenNotificationEditor } from '../../notification/ui/NotificationEditorContext';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { NotificationTool } from '../../notification/tools/notificationTool.types';
import { Icon } from '@shared/ui/primitives/Icon';

type Props = {
	nodeId: string;
	tool: NotificationTool | null;
	isReady: boolean;
	suppressTooltip?: boolean;
};

// Positioned spans wrap the Tooltip, never the other way round — see AggregatorBadge.
export function NotificationNodeBadges({ nodeId, tool, isReady, suppressTooltip }: Props) {
	const { t } = useI18n('workflow');
	const openEditor = useOpenNotificationEditor();
	// Like the aggregator badge: a click on the corner opens what it stands for, here the step's own dialog.
	const openConfiguration = (event: MouseEvent<HTMLSpanElement>) => {
		event.stopPropagation();
		openEditor?.(nodeId);
	};
	// The circle shows the tool itself; the corner says what kind of step this is.
	const toolBadge = tool
		? <span className='notificationToolBadgeMark notificationToolBadgeMark--bell'><Icon name='bell' size={11} color='primary' /></span>
		: <span className='notificationToolBadgeMark'>?</span>;
	const statusDot = <span className={`notificationNodeStatusDot ${isReady ? 'notificationNodeStatusDot--ready' : ''}`} />;

	return <>
		<span className={`notificationToolBadge nodrag nopan ${tool ? '' : 'notificationToolBadge--empty'} ${openEditor ? 'notificationToolBadge--clickable' : ''}`}
			data-testid={`workflow-notification-tool-badge-${nodeId}`}
			onClick={openEditor ? openConfiguration : undefined} onDoubleClick={(event) => event.stopPropagation()}>
			{suppressTooltip ? toolBadge : (
				<Tooltip content={tool ? t('notification.dialog.kind') : t('notification.node.chooseTool')} placement='top'>{toolBadge}</Tooltip>
			)}
		</span>
		<span className='circleNodeStatus' data-testid={`workflow-notification-status-${nodeId}`}>
			{suppressTooltip ? statusDot : (
				<Tooltip content={t(isReady ? 'notification.node.ready' : 'notification.node.incomplete')} placement='top'>
					{statusDot}
				</Tooltip>
			)}
		</span>
	</>;
}
