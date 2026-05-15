import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Play } from 'lucide-react';
import { NodeShell } from './NodeShell';
import type { StartWorkflowNode } from '../types/workflow.types';

export function StartNode({
	id,
	data,
	selected,
}: NodeProps<StartWorkflowNode>) {
	return (
		<NodeShell
			id={id}
			data={data}
			selected={selected}
			bottomLabel={data.title}
			rightAdd={{
				action: { sourceNodeId: id, direction: 'right' },
				showAlways: !!data.alwaysShowRightAdd,
				lineVisible: !!data.alwaysShowRightAdd,
			}}
		>
			<div className='startNode'>
				<Play size={26} />
			</div>

			<Handle
				type='source'
				position={Position.Right}
				className='handleInvisible'
			/>
		</NodeShell>
	);
}
