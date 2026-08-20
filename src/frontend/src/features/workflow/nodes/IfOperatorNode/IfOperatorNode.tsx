import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { IfWorkflowNode } from '../../types/workflow.types';
import { AggregatorBadge } from '../AggregatorBadge/AggregatorBadge';
import { NodeShell } from '../NodeShell/NodeShell';

export function IfOperatorNode({ id, data, selected, dragging }: NodeProps<IfWorkflowNode>) {
	const { t } = useI18n('workflow');

	return (
		<NodeShell
			id={id}
			data={data}
			selected={selected}
			rightAdd={{
				action: { sourceNodeId: id, sourceHandle: 'false', direction: 'right' },
				showAlways: !!data.rightLeaf,
				lineVisible: !!data.rightLeaf,
			}}
			bottomAdd={{
				action: { sourceNodeId: id, sourceHandle: 'true', direction: 'bottom' },
				showAlways: !!data.bottomLeaf,
				lineVisible: !!data.bottomLeaf,
			}}
		>
			<div className='ifNode'>
				<div className='operatorInnerText'>{t('node.if')}</div>
			</div>
			<AggregatorBadge
				dataAggregator={data.dataAggregator}
				testId={`workflow-node-aggregator-${id}`}
				suppressTooltip={dragging || data.isAnyNodeDragging}
				onOpenAggregatorEditor={() => data.onOpenAggregatorEditor?.(id)}
			/>
			<div className={`ifContinueLabel ${data.testRunActiveBranch === 'continue' ? 'ifBranchLabelActive' : ''}`}>{t('node.branchContinue')}</div>
			<div className={`ifTrueLabel ${data.testRunActiveBranch === 'true' ? 'ifBranchLabelActive' : ''}`}>{t('node.branchTrue')}</div>

			<Handle id='left' type='target' position={Position.Left} className='handleInvisible' />
			<Handle id='top' type='target' position={Position.Top} className='handleInvisible' />
			<Handle id='false' type='source' position={Position.Right} className='handleInvisible' />
			<Handle id='true' type='source' position={Position.Bottom} className='handleInvisible' />
		</NodeShell>
	);
}
