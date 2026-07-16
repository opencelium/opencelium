import type { NodeProps } from '@xyflow/react';
import { Globe } from 'lucide-react';
import type { SystemWorkflowNode } from '../../types/workflow.types';
import { MethodColorBadge } from '../MethodColorBadge/MethodColorBadge';
import { NodeShell } from '../NodeShell/NodeShell';
import { StandardNodeHandles } from '../StandardNodeHandles/StandardNodeHandles';

export function SystemMethodNode({ id, data, selected }: NodeProps<SystemWorkflowNode>) {
	return (
		<NodeShell
			id={id}
			data={data}
			selected={selected}
			bottomLabel={data.methodConfig?.method || data.subtitle || data.title}
			rightAdd={{
				action: { sourceNodeId: id, direction: 'right' },
				showAlways: !!data.isLeaf,
				lineVisible: !!data.isLeaf,
			}}
		>
			<div className='circleNode systemNode'>
				<Globe size={24} />
				<MethodColorBadge color={data.duplicateMethodColor} index={data.duplicateMethodIndex} />
			</div>

			<StandardNodeHandles />
		</NodeShell>
	);
}
