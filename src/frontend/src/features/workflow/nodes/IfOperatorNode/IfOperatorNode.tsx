import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { IfWorkflowNode } from '../../types/workflow.types';
import { NodeShell } from '../NodeShell';

export function IfOperatorNode({ id, data, selected }: NodeProps<IfWorkflowNode>) {
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
			<div className='ifFalseLabel'>{t('node.branchFalse')}</div>
			<div className='ifTrueLabel'>{t('node.branchTrue')}</div>

			<Handle id='left' type='target' position={Position.Left} className='handleInvisible' />
			<Handle id='top' type='target' position={Position.Top} className='handleInvisible' />
			<Handle id='false' type='source' position={Position.Right} className='handleInvisible' />
			<Handle id='true' type='source' position={Position.Bottom} className='handleInvisible' />
		</NodeShell>
	);
}
