import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import { FastForward, Loader2, Play, Square, TriangleAlert } from 'lucide-react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { StartWorkflowNode } from '../../types/workflow.types';
import { NodeShell } from '../NodeShell/NodeShell';
import { useStartNodeState } from './useStartNodeState';

export function StartNode({ id, data, selected, dragging }: NodeProps<StartWorkflowNode>) {
	const { t: tEntities } = useI18n('entities');
	const state = useStartNodeState();
	// The main button knows exactly two states: start and stop. While the
	// finished run's animation is still replaying it stays a "stop" shape —
	// clicking it then ends the playback without a backend terminate (nothing
	// is running anymore); useStartNodeState routes that internally. Only the
	// label changes for that case: "Stop test" would be misleading once there
	// is nothing left to actually terminate.
	const icon = state.isBusy ? (
		<Loader2 size={24} className='startNodeSpinner' />
	) : state.isRunning ? (
		<Square size={20} fill='currentColor' />
	) : (
		<Play size={26} />
	);
	const buttonLabelKey = state.isReplaying
		? 'connection.test.skipAnimation'
		: state.isRunning
			? 'connection.test.stop'
			: 'connection.test.start';
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
	// The paced animation is running behind the real test — offer a one-click
	// jump to the run's actual current state, right under the run/stop button.
	// Once the backend run itself is over (isReplaying), there is no "live" to
	// jump to anymore — only the leftover replay, which the main button above
	// already skips (relabeled "Skip animation") — so this control disappears
	// rather than keep dangling a "Jump to live" action that no longer applies.
	const skipToLiveControl = state.testRun && state.isPlaybackBehind && !state.isReplaying && (
		<button
			type='button'
			className='startNodeSkipLive'
			onClick={(event) => {
				event.stopPropagation();
				state.skipToLive();
			}}
			data-testid='workflow-test-skip-live'
		>
			<FastForward size={12} />
			<span>{tEntities('connection.test.skipToLive')}</span>
		</button>
	);
	const button = (
		<button
			type='button'
			className={['startNode', 'startNodeButton', state.isRunning ? 'startNodeRunning' : '', state.isStartUnavailable && !state.isReplaying ? 'startNodeUnavailable' : ''].join(' ')}
			onClick={state.toggleTestRun}
			disabled={state.isBusy || (state.isStartUnavailable && !state.isReplaying)}
			aria-label={tEntities(buttonLabelKey)}
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
			bottomExtra={subscriptionAlert || socketAlert || otherTestAlert || skipToLiveControl || null}
			rightAdd={{ action: { sourceNodeId: id, direction: 'right' }, showAlways: !!data.alwaysShowRightAdd, lineVisible: !!data.alwaysShowRightAdd }}
		>
			{!state.testRun ? (
				<div className='startNode'><Play size={26} /></div>
			) : state.isSocketConnected && !state.isSubscriptionBlocked && !state.isOtherTestRunning && !dragging && !data.isAnyNodeDragging ? (
				<Tooltip content={tEntities(buttonLabelKey)}>{button}</Tooltip>
			) : button}
			<Handle type='source' position={Position.Right} className='handleInvisible' />
		</NodeShell>
	);
}
