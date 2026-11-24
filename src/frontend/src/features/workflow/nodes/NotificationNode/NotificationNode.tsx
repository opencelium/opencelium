import type { KeyboardEvent } from 'react';
import type { NodeProps } from '@xyflow/react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Icon } from '@shared/ui/primitives/Icon';
import type { NotificationWorkflowNode } from '../../types/workflow.types';
import { useOpenNotificationEditor } from '../../notification/ui/NotificationEditorContext';
import { getNotificationTool } from '../../notification/tools/notificationTools';
import { getActiveDraft } from '../../notification/model/notificationConfig';
import { AggregatorBadge } from '../AggregatorBadge/AggregatorBadge';
import { NodeShell } from '../NodeShell/NodeShell';
import { StandardNodeHandles } from '../StandardNodeHandles/StandardNodeHandles';
import { NotificationNodeBadges } from './NotificationNodeBadges';
import { NotificationToolMark } from '../../notification/ui/NotificationToolMark';

export function NotificationNode({ id, data, selected, dragging }: NodeProps<NotificationWorkflowNode>) {
	const { t } = useI18n('workflow');
	const openEditor = useOpenNotificationEditor();
	const suppressTooltip = dragging || data.isAnyNodeDragging;
	const config = data.notification;
	const tool = config?.tool ? getNotificationTool(config.tool) : null;
	const isReady = !!tool && !!config && !!getActiveDraft(config)?.webhookUrl.trim();
	const label = data.subtitle || data.title;

	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.target !== event.currentTarget) return;
		if (event.key === 'Enter') {
			event.preventDefault();
			openEditor?.(id);
		}
		if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
			event.preventDefault();
			const rect = event.currentTarget.getBoundingClientRect();
			data.onOpenContextMenu?.({ nodeId: id, x: rect.left, y: rect.bottom + 4, kind: data.kind });
		}
	};

	return (
		<NodeShell
			id={id}
			data={data}
			selected={selected}
			testId={`workflow-notification-node-${id}`}
			bottomLabel={label}
			rightAdd={{
				action: { sourceNodeId: id, direction: 'right' },
				showAlways: !!data.isLeaf && !data.jump,
				lineVisible: !!data.isLeaf && !data.jump,
			}}
		>
			<div className='circleNode notificationNode' tabIndex={0} role='button'
				aria-label={t('notification.node.ariaLabel', { label })} onKeyDown={onKeyDown}
				data-testid={`workflow-notification-node-body-${id}`}>
				{!tool ? <Icon name='bell' size={24} />
					: tool.logo ? <img className='circleNodeImage' src={tool.logo} alt='' draggable={false} />
					: <NotificationToolMark tool={tool} className='notificationNodeToolMark' />}
				<NotificationNodeBadges nodeId={id} tool={tool} isReady={isReady} suppressTooltip={suppressTooltip} />
				<AggregatorBadge
					dataAggregator={data.dataAggregator}
					testId={`workflow-node-aggregator-${id}`}
					suppressTooltip={suppressTooltip}
					onOpenAggregatorEditor={() => data.onOpenAggregatorEditor?.(id)}
				/>
			</div>

			<StandardNodeHandles />
		</NodeShell>
	);
}
