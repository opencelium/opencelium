import type { NodeProps } from '@xyflow/react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Icon } from '@shared/ui/primitives/Icon';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { TriggerConnectionWorkflowNode } from '../../types/workflow.types';
import { AggregatorBadge } from '../AggregatorBadge/AggregatorBadge';
import { MethodColorBadge } from '../MethodColorBadge/MethodColorBadge';
import { NodeShell } from '../NodeShell/NodeShell';
import { StandardNodeHandles } from '../StandardNodeHandles/StandardNodeHandles';

export function TriggerConnectionNode({ id, data, selected, dragging }: NodeProps<TriggerConnectionWorkflowNode>) {
	const { t } = useI18n('workflow');
	const suppressTooltip = dragging || data.isAnyNodeDragging;
	const webhookDisplayName = data.triggerConnection?.connectionTitle ?? data.title;
	const webhookIcon = <Icon name='webhook' size={24} />;
	const asyncIcon = <Icon name='flash' size={12} color='inherit' />;
	// The positioned badge span must wrap `Tooltip`, not the other way round — see
	// AggregatorBadge for the full explanation of why passing an absolutely-positioned
	// span as Tooltip's children drags the tooltip's anchor to the node's center.
	const asyncBadge = (
		<span className='circleNodeAsyncBadge'>
			{suppressTooltip ? asyncIcon : <Tooltip content={t('node.asyncBadge')}>{asyncIcon}</Tooltip>}
		</span>
	);

	return (
		<NodeShell
			id={id}
			data={data}
			selected={selected}
			bottomLabel={data.subtitle || data.title}
			rightAdd={{
				action: { sourceNodeId: id, direction: 'right' },
				showAlways: !!data.isLeaf && !data.jump,
				lineVisible: !!data.isLeaf && !data.jump,
			}}
		>
			<div className='circleNode systemNode'>
				{webhookDisplayName && !suppressTooltip ? (
					<Tooltip content={webhookDisplayName}>{webhookIcon}</Tooltip>
				) : webhookIcon}
				<MethodColorBadge
					color={data.duplicateMethodColor}
					index={data.duplicateMethodIndex}
					suppressTooltip={suppressTooltip}
				/>
				<AggregatorBadge
					dataAggregator={data.dataAggregator}
					testId={`workflow-node-aggregator-${id}`}
					suppressTooltip={suppressTooltip}
					onOpenAggregatorEditor={() => data.onOpenAggregatorEditor?.(id)}
				/>
				{asyncBadge}
			</div>

			<StandardNodeHandles />
		</NodeShell>
	);
}
