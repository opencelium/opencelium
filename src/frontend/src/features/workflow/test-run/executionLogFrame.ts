import type { IMessage } from '@stomp/stompjs';
import type { ExecutionSocketLog } from '@features/logs';

/**
 * Every execution-log frame the canvas reacts to goes through here: parse, trace,
 * hand over. All four subscriptions to `/execution/logs/{channelId}` share it, so
 * the console shows the run exactly as the backend reports it, in arrival order.
 *
 * The summary line is what answers "what did the engine actually execute": the
 * `indexPath` is the workflow tree index of the element (`1_0_1`, `1_1`, …), and
 * `loop` is the comma-separated iteration index of its enclosing loops. Methods
 * emit a single COMPLETE, operators a PENDING on entry and a COMPLETE on exit —
 * so a method missing from this trace never ran (e.g. because a joint skipped it).
 */
export const handleExecutionLogFrame = (
	frame: IMessage,
	onLog: (log: ExecutionSocketLog) => void,
) => {
	try {
		const log = JSON.parse(frame.body) as ExecutionSocketLog;
		const loop = log.properties?.loopIndex;
		console.log(
			`[test-run] ${log.indexPath || '-'} ${log.status} ${log.type}`
			+ (loop ? ` loop=${loop}` : '')
			+ (log.properties?.name ? ` ${log.properties.name}` : '')
			+ (log.error ? ` ERROR@${log.error.originOfErrorPath}: ${log.error.message}` : ''),
			log,
		);
		onLog(log);
	} catch (error) {
		console.error('[test-run] failed to parse execution log', error, frame.body);
	}
};
