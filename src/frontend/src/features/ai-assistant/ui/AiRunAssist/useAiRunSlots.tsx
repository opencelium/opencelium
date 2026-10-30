import type { ReactNode } from 'react';
import type { LogTargetSlots } from '@features/logs';
import { isAiConfigured, useGetAiHealthQuery } from '../../api/aiApi';
import { type RunAssistTarget, useRunFailureAssist } from '../../run/useRunFailureAssist';
import { AiRunPanel } from './AiRunPanel';
import { AiRunRowActions } from './AiRunRowActions';

type Args = RunAssistTarget & {
	/** The run failed and its error trail has been revealed in the tree. */
	isFailed: boolean;
	isLocked: boolean;
};

/**
 * Explain / Fix with AI placed on the failing element of the test-run log tree. A failure without an element (the
 * execution itself failed) has no row to sit on, so its actions and answer come back as `detached`, for under the tree.
 */
export function useAiRunSlots({ isFailed, isLocked, ...target }: Args): { slots: LogTargetSlots; detached: ReactNode } {
	const isConfigured = isAiConfigured();
	const health = useGetAiHealthQuery(undefined, { skip: !isConfigured });
	const assist = useRunFailureAssist(target);
	const isAvailable = isConfigured && health.data?.ollama.reachable === true && health.data.workflowModel.available;
	if (!isFailed || !isAvailable || !assist.failed) return { slots: {}, detached: null };

	const actions = <AiRunRowActions assist={assist} />;
	const panel = <AiRunPanel assist={assist} nodes={target.nodes} isLocked={isLocked} />;
	if (!assist.failed.indexPath) {
		return { slots: {}, detached: <div className="aiRunDetached"><div className="aiRunDetachedActions">{actions}</div>{panel}</div> };
	}
	return {
		slots: { target: { indexPath: assist.failed.indexPath, loopIndex: assist.failed.loopIndex }, targetActions: actions, targetAddon: panel },
		detached: null,
	};
}
