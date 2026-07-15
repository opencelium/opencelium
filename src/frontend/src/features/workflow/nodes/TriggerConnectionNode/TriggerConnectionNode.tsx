import type { NodeProps } from '@xyflow/react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Icon } from '@shared/ui/primitives/Icon';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { TriggerConnectionWorkflowNode } from '../../types/workflow.types';
import { MethodColorBadge } from '../MethodColorBadge';
import { NodeShell } from '../NodeShell/NodeShell';
import { StandardNodeHandles } from '../StandardNodeHandles/StandardNodeHandles';

export function TriggerConnectionNode({ id, data, selected, dragging }: NodeProps<TriggerConnectionWorkflowNode>) {
	const { t } = useI18n('workflow');
	const suppressTooltip = dragging || data.isAnyNodeDragging;
	const asyncBadge = (
		<span className='circleNodeAsyncBadge'>
			<Icon name='flash' size={12} color='inherit' />
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
				showAlways: !!data.isLeaf,
				lineVisible: !!data.isLeaf,
			}}
		>
			<div className='circleNode systemNode'>
				<Icon name='webhook' size={24} />
				<MethodColorBadge color={data.duplicateMethodColor} index={data.duplicateMethodIndex} />
				{suppressTooltip ? asyncBadge : <Tooltip content={t('node.asyncBadge')}>{asyncBadge}</Tooltip>}
			</div>

			<StandardNodeHandles />
		</NodeShell>
	);
}
