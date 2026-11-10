import type { ReactNode } from 'react';
import { Button } from '@shared/ui/primitives/Button';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import '../../styles/ai-proposal.css';

type ProposalAction = { label: string; onClick: () => void; testId: string };

type Props = {
	/** Takes the proposal over. `blockedReason` disables it and says why in a tooltip. */
	apply: ProposalAction & { isDisabled?: boolean; blockedReason?: string | null };
	discard: ProposalAction;
	/** Further actions next to Apply (regenerate, compare in playground). */
	extra?: ReactNode;
};

/**
 * The one way an AI result is taken over: Discard on the left, Apply on the right. Every AI button proposes and
 * nothing changes until Apply; `notifyAiApplied` then offers Undo.
 */
export function AiProposalActions({ apply, discard, extra }: Props) {
	const isBlocked = Boolean(apply.blockedReason);
	return (
		<div className="aiProposalActions">
			<Button onClick={discard.onClick} testId={discard.testId}>{discard.label}</Button>
			<div className="aiProposalActionsMain">
				{extra}
				{/* A tooltip with no content stays mounted, so the button does not remount when the block clears. */}
				<Tooltip content={apply.blockedReason || null} maxWidth={260}>
					<span className="aiProposalApplyWrap">
						<Button type="primary" onClick={apply.onClick} disabled={apply.isDisabled || isBlocked} testId={apply.testId}>
							{apply.label}
						</Button>
					</span>
				</Tooltip>
			</div>
		</div>
	);
}
