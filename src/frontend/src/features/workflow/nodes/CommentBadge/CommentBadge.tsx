import type { MouseEvent } from 'react';
import { Icon } from '@shared/ui/primitives/Icon';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { WorkflowNodeData } from '../../types/workflow.types';

type Props = {
	anchoredComment: WorkflowNodeData['anchoredComment'];
	suppressTooltip?: boolean;
	testId?: string;
	onToggleComment?: (commentNodeId: string) => void;
};

/** Shows/hides the note attached to this node. Only rendered when the node
 * actually has one — creating a note goes through the sidebar palette. */
export function CommentBadge({ anchoredComment, suppressTooltip, testId, onToggleComment }: Props) {
	const { t } = useI18n('workflow');
	if (!anchoredComment) return null;

	const { nodeId, collapsed } = anchoredComment;
	// Bare glyph, no chip: the open/minimized state is carried by its colour —
	// primary while the note is on the canvas, muted while it is minimized. Both
	// read against the canvas background in either theme, which an amber glyph
	// (the note's own colour) does not in the light themes.
	const icon = <Icon name='comment' size={17} color={collapsed ? 'default' : 'primary'} isSubtle={collapsed} />;

	const handleClick = (event: MouseEvent<HTMLSpanElement>) => {
		event.stopPropagation();
		onToggleComment?.(nodeId);
	};

	// The positioned span must wrap `Tooltip`, not the other way round — see
	// AggregatorBadge for why an absolutely-positioned Tooltip child breaks the
	// tooltip's anchor point.
	return (
		<span
			className='nodeCommentBadge nodrag nopan'
			data-testid={testId}
			onClick={handleClick}
			onDoubleClick={(event) => event.stopPropagation()}
		>
			{suppressTooltip ? icon : (
				<Tooltip content={t(collapsed ? 'comment.toggle.show' : 'comment.toggle.hide')} placement='top'>
					{icon}
				</Tooltip>
			)}
		</span>
	);
}
