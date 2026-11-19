import type { NodeProps } from '@xyflow/react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Icon } from '@shared/ui/primitives/Icon';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { SetGlobalWorkflowNode } from '../../types/workflow.types';
import { NodeShell } from '../NodeShell/NodeShell';
import { StandardNodeHandles } from '../StandardNodeHandles/StandardNodeHandles';

export function SetGlobalNode({ id, data, selected, dragging }: NodeProps<SetGlobalWorkflowNode>) {
	const { t } = useI18n('workflow');
	const suppressTooltip = dragging || data.isAnyNodeDragging;
	const variable = data.setGlobal?.variable;
	const icon = <Icon name='variable' size={24} />;
	const tooltip = variable
		? t('setGlobal.nodeTooltip', { variable, value: data.setGlobal?.value ?? '' })
		: t('setGlobal.notConfigured');

	return (
		<NodeShell
			id={id}
			data={data}
			selected={selected}
			bottomLabel={variable ? `${t('setGlobal.label')} ${variable}` : data.title}
			rightAdd={{
				action: { sourceNodeId: id, direction: 'right' },
				showAlways: !!data.isLeaf && !data.jump,
				lineVisible: !!data.isLeaf && !data.jump,
			}}
		>
			<div className='circleNode systemNode' data-testid={`workflow-node-setglobal-${id}`}>
				{suppressTooltip ? icon : <Tooltip content={tooltip}>{icon}</Tooltip>}
			</div>
			<StandardNodeHandles />
		</NodeShell>
	);
}
