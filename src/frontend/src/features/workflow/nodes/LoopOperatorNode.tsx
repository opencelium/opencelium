import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { NodeShell } from './NodeShell';
import type { LoopWorkflowNode } from '../types/workflow.types';
import { useI18n } from '@shared/i18n/hooks/useI18n';

export function LoopOperatorNode({
	id,
	data,
	selected,
}: NodeProps<LoopWorkflowNode>) {
	const { t } = useI18n('workflow');
	return (
		<NodeShell
			id={id}
			data={data}
			selected={selected}
			rightAdd={{
				action: {
					sourceNodeId: id,
					sourceHandle: 'right',
					direction: 'right',
				},
				showAlways: !!data.rightLeaf,
				lineVisible: !!data.rightLeaf,
			}}
			bottomAdd={{
				action: {
					sourceNodeId: id,
					sourceHandle: 'bottom',
					direction: 'bottom',
				},
				showAlways: !!data.bottomLeaf,
				lineVisible: !!data.bottomLeaf,
			}}
		>
			<div className='ifNode'>
				<div className='operatorInnerText'>{t('node.loop')}</div>
			</div>

			<Handle
				id='left'
				type='target'
				position={Position.Left}
				className='handleInvisible'
			/>
			<Handle
				id='top'
				type='target'
				position={Position.Top}
				className='handleInvisible'
			/>
			<Handle
				id='right'
				type='source'
				position={Position.Right}
				className='handleInvisible'
			/>
			<Handle
				id='bottom'
				type='source'
				position={Position.Bottom}
				className='handleInvisible'
			/>
		</NodeShell>
	);
}
