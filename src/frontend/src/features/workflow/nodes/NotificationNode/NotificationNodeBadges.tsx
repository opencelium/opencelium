import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { NotificationTool } from '../../notification/tools/notificationTool.types';
import { useNotificationToolName } from '../../notification/ui/useNotificationToolName';
import { NotificationToolMark } from '../../notification/ui/NotificationToolMark';

type Props = {
	nodeId: string;
	tool: NotificationTool | null;
	isReady: boolean;
	suppressTooltip?: boolean;
};

// Positioned spans wrap the Tooltip, never the other way round — see AggregatorBadge.
export function NotificationNodeBadges({ nodeId, tool, isReady, suppressTooltip }: Props) {
	const { t } = useI18n('workflow');
	const toolName = useNotificationToolName();
	const toolBadge = tool
		? <NotificationToolMark tool={tool} className='notificationToolBadgeMark' />
		: <span className='notificationToolBadgeMark'>?</span>;
	const statusDot = <span className={`notificationNodeStatusDot ${isReady ? 'notificationNodeStatusDot--ready' : ''}`} />;

	return <>
		<span className={`notificationToolBadge ${tool ? '' : 'notificationToolBadge--empty'}`}
			data-testid={`workflow-notification-tool-badge-${nodeId}`}>
			{suppressTooltip ? toolBadge : (
				<Tooltip content={tool ? toolName(tool) : t('notification.node.chooseTool')} placement='top'>{toolBadge}</Tooltip>
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
