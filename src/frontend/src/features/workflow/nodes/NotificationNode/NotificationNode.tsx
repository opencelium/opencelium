import { useContext } from 'react';
import { NotificationOpenContext } from '../../notification/NotificationOpenContext';
import type { NodeProps } from '@xyflow/react';
import { Bell } from 'lucide-react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { notificationTools } from './notificationTools';
import type { NotificationWorkflowNode } from '../../types/workflow.types';
import { NodeShell } from '../NodeShell/NodeShell';
import { StandardNodeHandles } from '../StandardNodeHandles/StandardNodeHandles';
import './notificationNode.css';

export function NotificationNode({ id, data, selected }: NodeProps<NotificationWorkflowNode>) {
	const open = useContext(NotificationOpenContext);
	const { t } = useI18n('workflow');
	const toolId = data.notificationConfig?.tool;
	const tool = toolId ? notificationTools[toolId] : undefined;
	const toolName = tool ? tool.name ?? t('notification.generic') : t('notification.noTool');
	const label = data.subtitle || data.title || t('notification.label');
	const hasWebhook = !!(toolId && data.notificationConfig?.drafts?.[toolId]?.webhookUrl.trim());

	return (
		<NodeShell id={id} data={data} selected={selected} bottomLabel={label}
			bottomExtra={<span className="notificationNodeTool">{toolName}</span>}
			testId="workflow-notification-node">
			<div className="circleNode notificationNode" tabIndex={0} role="button" aria-disabled={!open}
				onDoubleClick={(event) => {
					if (!open) return;
					event.stopPropagation();
					open({ id });
				}}
				onKeyDown={(event) => {
					if (!open || (event.key !== 'Enter' && event.key !== ' ')) return;
					event.preventDefault();
					event.stopPropagation();
					open({ id });
				}}
				aria-label={t('notification.ariaLabel').replace('{label}', label)}>
				<Bell size={24} aria-hidden="true" />
				{tool && <span className="notificationNodeBadge" style={{ backgroundColor: tool.color }}>{tool.badge}</span>}
				<span className="notificationNodeStatus" data-configured={hasWebhook}
					aria-label={t(hasWebhook ? 'notification.webhookSet' : 'notification.webhookMissing')} />
			</div>
			<StandardNodeHandles />
		</NodeShell>
	);
}
