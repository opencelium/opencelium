import type { MouseEvent } from 'react';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useBindingLensNode } from '../../lens/BindingLensNodeContext';

type Props = {
	nodeId: string;
	suppressTooltip?: boolean;
};

/** The lens's at-rest state on a method node: how many of its request fields are
 * filled from elsewhere, how many of its response fields others read, and whether
 * any of that is broken. Rendered only while the lens is open, and only on a
 * method that has bindings at all — an empty badge would say nothing that its
 * absence does not. */
export function BindingBadge({ nodeId, suppressTooltip }: Props) {
	const { t } = useI18n('workflow');
	const lens = useBindingLensNode();
	const summary = lens?.summaryByNodeId.get(nodeId);
	if (!lens || !summary) return null;

	const isPinned = lens.pinnedNodeId === nodeId;
	const tooltip = [
		summary.receives > 0 ? t('bindingLens.badgeReceives', { count: summary.receives }) : '',
		summary.provides > 0 ? t('bindingLens.badgeProvides', { count: summary.provides }) : '',
		summary.broken > 0 ? t('bindingLens.badgeBroken', { count: summary.broken }) : '',
		t(isPinned ? 'bindingLens.badgeUnpinHint' : 'bindingLens.badgePinHint'),
	].filter(Boolean).join(' · ');

	const handleClick = (event: MouseEvent<HTMLSpanElement>) => {
		event.stopPropagation();
		lens.onToggleFocus(nodeId);
	};

	const counts = (
		<span className='nodeBindingBadgeCounts'>
			{summary.receives > 0 && (
				<span className='nodeBindingBadgeCount'>{`↓${summary.receives}`}</span>
			)}
			{summary.provides > 0 && (
				<span className='nodeBindingBadgeCount'>{`↑${summary.provides}`}</span>
			)}
			{summary.broken > 0 && (
				<span className='nodeBindingBadgeBroken'>{`!${summary.broken}`}</span>
			)}
		</span>
	);

	// The positioned span must wrap `Tooltip`, not the other way round — see
	// AggregatorBadge for why an absolutely-positioned Tooltip child drags the
	// tooltip's anchor to the node's centre.
	return (
		<span
			className={`nodeBindingBadge nodrag nopan ${isPinned ? 'nodeBindingBadgePinned' : ''}`}
			data-testid={`workflow-binding-badge-${nodeId}`}
			onClick={handleClick}
			onDoubleClick={(event) => event.stopPropagation()}
		>
			{suppressTooltip ? counts : (
				<Tooltip content={tooltip} placement='bottom'>{counts}</Tooltip>
			)}
		</span>
	);
}
