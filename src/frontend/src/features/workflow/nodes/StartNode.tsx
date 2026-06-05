import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Loader2, Play, Square, TriangleAlert } from 'lucide-react';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { NodeShell } from './NodeShell';
import { useTestRun } from '../test-run/useTestRun';
import { useSubscriptionIssue } from '@entities/subscription/model/useSubscriptionIssue';
import type { StartWorkflowNode } from '../types/workflow.types';

export function StartNode({
	id,
	data,
	selected,
}: NodeProps<StartWorkflowNode>) {
	const testRun = useTestRun();
	const { t: tEntities } = useI18n('entities');
	const { issue: subscriptionIssue } = useSubscriptionIssue();

	const socketStatus = testRun?.socketStatus ?? 'idle';
	const phase = testRun?.phase ?? 'idle';
	const isSocketConnected = socketStatus === 'connected';
	const isSocketConnecting = socketStatus === 'idle' || socketStatus === 'connecting';
	const isRunning = phase === 'starting' || phase === 'running';
	const isBusy = phase === 'starting' || phase === 'stopping';
	// A blocked subscription forbids starting a test run, but stopping a running one stays allowed.
	const isSubscriptionBlocked = subscriptionIssue !== null && !isRunning;

	const handleClick = () => {
		if (!testRun || !isSocketConnected || isBusy || isSubscriptionBlocked) return;
		if (isRunning) void testRun.stopTest();
		else void testRun.startTest();
	};

	const icon = isBusy ? (
		<Loader2 size={24} className='startNodeSpinner' />
	) : isRunning ? (
		<Square size={20} fill='currentColor' />
	) : (
		<Play size={26} />
	);

	const socketAlert =
		testRun && !isSocketConnected ? (
			<div className='startNodeAlert'>
				<TriangleAlert size={12} />
				<span>
					{tEntities(
						isSocketConnecting
							? 'connection.test.socketConnecting'
							: 'connection.test.socketDisconnected',
					)}
				</span>
			</div>
		) : null;

	const subscriptionAlert =
		testRun && isSubscriptionBlocked ? (
			<div className='startNodeAlert'>
				<TriangleAlert size={12} />
				<span>
					{tEntities(`subscription.banner.${subscriptionIssue}` as never)}
				</span>
			</div>
		) : null;

	const button = (
		<button
			type='button'
			className={[
				'startNode',
				'startNodeButton',
				isRunning ? 'startNodeRunning' : '',
				!isSocketConnected || isSubscriptionBlocked ? 'startNodeUnavailable' : '',
			].join(' ')}
			onClick={handleClick}
			disabled={!isSocketConnected || isBusy || isSubscriptionBlocked}
			aria-label={tEntities(isRunning ? 'connection.test.stop' : 'connection.test.start')}
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
			bottomExtra={subscriptionAlert ?? socketAlert}
			rightAdd={{
				action: { sourceNodeId: id, direction: 'right' },
				showAlways: !!data.alwaysShowRightAdd,
				lineVisible: !!data.alwaysShowRightAdd,
			}}
		>
			{!testRun ? (
				<div className='startNode'>
					<Play size={26} />
				</div>
			) : isSocketConnected && !isSubscriptionBlocked ? (
				<Tooltip
					content={tEntities(isRunning ? 'connection.test.stop' : 'connection.test.start')}
				>
					{button}
				</Tooltip>
			) : (
				// The disabled button swallows hover events; the alert below the
				// node already explains why the test run is unavailable.
				button
			)}

			<Handle
				type='source'
				position={Position.Right}
				className='handleInvisible'
			/>
		</NodeShell>
	);
}
