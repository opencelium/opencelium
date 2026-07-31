import type { NodeProps } from '@xyflow/react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { LoopWorkflowNode } from '../../types/workflow.types';
import { AggregatorBadge } from '../AggregatorBadge/AggregatorBadge';
import { NodeShell } from '../NodeShell/NodeShell';
import { StandardNodeHandles } from '../StandardNodeHandles/StandardNodeHandles';

export function LoopOperatorNode({ id, data, selected, dragging }: NodeProps<LoopWorkflowNode>) {
	const { t } = useI18n('workflow');

	return (
		<NodeShell
			id={id}
			data={data}
			selected={selected}
			rightAdd={{
				action: { sourceNodeId: id, sourceHandle: 'right', direction: 'right' },
				showAlways: !!data.rightLeaf,
				lineVisible: !!data.rightLeaf,
			}}
			bottomAdd={{
				action: { sourceNodeId: id, sourceHandle: 'bottom', direction: 'bottom' },
				showAlways: !!data.bottomLeaf,
				lineVisible: !!data.bottomLeaf,
			}}
		>
			<div className='ifNode'>
				<div className='operatorInnerText'>{t('node.loop')}</div>
			</div>
			<AggregatorBadge
				dataAggregator={data.dataAggregator}
				testId={`workflow-node-aggregator-${id}`}
				suppressTooltip={dragging || data.isAnyNodeDragging}
				onOpenAggregatorEditor={() => data.onOpenAggregatorEditor?.(id)}
			/>
			<StandardNodeHandles />
		</NodeShell>
	);
}
