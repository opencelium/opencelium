import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { NodeShell } from './NodeShell';
import type { IfWorkflowNode } from '../types/workflow.types';

export function IfOperatorNode({
	id,
	data,
	selected,
}: NodeProps<IfWorkflowNode>) {
	return (
		<NodeShell
			id={id}
			data={data}
			selected={selected}
			rightAdd={{
				action: {
					sourceNodeId: id,
					sourceHandle: 'false',
					direction: 'right',
				},
				showAlways: !!data.rightLeaf,
				lineVisible: !!data.rightLeaf,
			}}
			bottomAdd={{
				action: {
					sourceNodeId: id,
					sourceHandle: 'true',
					direction: 'bottom',
				},
				showAlways: !!data.bottomLeaf,
				lineVisible: !!data.bottomLeaf,
			}}
		>
			<div className='ifNode'>
				<div className='operatorInnerText'>If</div>
			</div>

			<div className='ifFalseLabel'>false</div>
			<div className='ifTrueLabel'>true</div>

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
				id='false'
				type='source'
				position={Position.Right}
				className='handleInvisible'
			/>
			<Handle
				id='true'
				type='source'
				position={Position.Bottom}
				className='handleInvisible'
			/>
		</NodeShell>
	);
}
