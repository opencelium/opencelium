import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import { Loader2, Play, Square, TriangleAlert } from 'lucide-react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { StartWorkflowNode } from '../../types/workflow.types';
import { NodeShell } from '../NodeShell';
import { useStartNodeState } from './useStartNodeState';

export function StartNode({ id, data, selected, dragging }: NodeProps<StartWorkflowNode>) {
	const { t: tEntities } = useI18n('entities');
	const state = useStartNodeState();
	const icon = state.isBusy ? (
		<Loader2 size={24} className='startNodeSpinner' />
	) : state.isRunning ? (
		<Square size={20} fill='currentColor' />
	) : (
		<Play size={26} />
	);
	const socketAlert = state.testRun && !state.isSocketConnected && (
		<div className='startNodeAlert'>
			<TriangleAlert size={12} />
			<span>{tEntities(state.isSocketConnecting ? 'connection.test.socketConnecting' : 'connection.test.socketDisconnected')}</span>
		</div>
	);
	const subscriptionAlert = state.testRun && state.isSubscriptionBlocked && (
		<div className='startNodeAlert'>
			<TriangleAlert size={12} />
			<span>{tEntities(`subscription.banner.${state.subscriptionIssue}` as never)}</span>
		</div>
	);
	const otherTestAlert = state.testRun && state.isOtherTestRunning && state.isSocketConnected && !state.isSubscriptionBlocked && (
		<div className='startNodeAlert'>
			<TriangleAlert size={12} />
			<span>{tEntities('connection.test.otherTestRunning')}</span>
		</div>
	);
	const button = (
		<button
			type='button'
			className={['startNode', 'startNodeButton', state.isRunning ? 'startNodeRunning' : '', state.isStartUnavailable ? 'startNodeUnavailable' : ''].join(' ')}
			onClick={state.toggleTestRun}
			disabled={state.isStartUnavailable || state.isBusy}
			aria-label={tEntities(state.isRunning ? 'connection.test.stop' : 'connection.test.start')}
		>
			{icon}
		</button>
	);

	return (
		<NodeShell
			id={id}
			data={data}
			selected={selected}
			bottomLabel={data.title}
			bottomExtra={subscriptionAlert || socketAlert || otherTestAlert || null}
			rightAdd={{ action: { sourceNodeId: id, direction: 'right' }, showAlways: !!data.alwaysShowRightAdd, lineVisible: !!data.alwaysShowRightAdd }}
		>
			{!state.testRun ? (
				<div className='startNode'><Play size={26} /></div>
			) : state.isSocketConnected && !state.isSubscriptionBlocked && !state.isOtherTestRunning && !dragging && !data.isAnyNodeDragging ? (
				<Tooltip content={tEntities(state.isRunning ? 'connection.test.stop' : 'connection.test.start')}>{button}</Tooltip>
			) : button}
			<Handle type='source' position={Position.Right} className='handleInvisible' />
		</NodeShell>
	);
}
