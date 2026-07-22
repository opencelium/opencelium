import type { NodeProps } from '@xyflow/react';
import { Globe } from 'lucide-react';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { SystemWorkflowNode } from '../../types/workflow.types';
import { AggregatorBadge } from '../AggregatorBadge/AggregatorBadge';
import { MethodColorBadge } from '../MethodColorBadge/MethodColorBadge';
import { NodeShell } from '../NodeShell/NodeShell';
import { StandardNodeHandles } from '../StandardNodeHandles/StandardNodeHandles';

export function SystemMethodNode({ id, data, selected, dragging }: NodeProps<SystemWorkflowNode>) {
	const suppressTooltip = dragging || data.isAnyNodeDragging;
	const methodType = data.methodConfig?.method || data.subtitle;
	const icon = <Globe size={24} />;
	// A user-edited label (data.labelEdited) must win over the raw HTTP method — otherwise
	// the method type (which is always truthy) masks the custom label the user just set.
	const bottomLabel = data.labelEdited
		? data.subtitle || data.title
		: data.methodConfig?.method || data.subtitle || data.title;

	return (
		<NodeShell
			id={id}
			data={data}
			selected={selected}
			bottomLabel={bottomLabel}
			rightAdd={{
				action: { sourceNodeId: id, direction: 'right' },
				showAlways: !!data.isLeaf,
				lineVisible: !!data.isLeaf,
			}}
		>
			<div className='circleNode systemNode'>
				{methodType && !suppressTooltip ? (
					<Tooltip content={methodType}>{icon}</Tooltip>
				) : icon}
				<MethodColorBadge
					color={data.duplicateMethodColor}
					index={data.duplicateMethodIndex}
					suppressTooltip={suppressTooltip}
				/>
				<AggregatorBadge
					dataAggregator={data.dataAggregator}
					testId={`workflow-node-aggregator-${id}`}
					suppressTooltip={suppressTooltip}
				/>
			</div>

			<StandardNodeHandles />
		</NodeShell>
	);
}
