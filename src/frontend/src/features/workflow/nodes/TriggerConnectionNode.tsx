import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Icon } from '@shared/ui/primitives/Icon';
import { NodeShell } from './NodeShell';
import { MethodColorBadge } from './MethodColorBadge';
import type { TriggerConnectionWorkflowNode } from '../types/workflow.types';

export function TriggerConnectionNode({
	id,
	data,
	selected,
}: NodeProps<TriggerConnectionWorkflowNode>) {
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
