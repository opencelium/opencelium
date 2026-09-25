import type { ChangeEvent, MouseEvent } from 'react';
import { NodeResizer, type NodeProps } from '@xyflow/react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Icon } from '@shared/ui/primitives/Icon';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { NodeToolbar } from '../../components/node/NodeToolbar/NodeToolbar';
import type { CommentWorkflowNode } from '../../types/workflow.types';
import { COMMENT_NODE_MIN_SIZE } from '../../utils/graph.constants';

export function CommentNode({ id, data, selected }: NodeProps<CommentWorkflowNode>) {
	const { t } = useI18n('workflow');
	const onChangeText = data.onChangeCommentText;
	const isPreviewNode = data.dragGhost || data.dropPlaceholder;
	const onTextChange = (event: ChangeEvent<HTMLTextAreaElement>) =>
		onChangeText?.(id, event.target.value);

	return (
		<div
			className='commentNodeWrap'
			// A comment has no configuration, so the node context menu (method /
			// operator actions) has nothing to offer for it.
			onContextMenu={(event: MouseEvent<HTMLDivElement>) => event.preventDefault()}
		>
			{selected && !isPreviewNode && data.onDeleteNode && (
				<NodeToolbar canDelete onDelete={() => data.onDeleteNode?.(id)} />
			)}
			<NodeResizer
				isVisible={!!selected && !!onChangeText && !isPreviewNode}
				minWidth={COMMENT_NODE_MIN_SIZE.width}
				minHeight={COMMENT_NODE_MIN_SIZE.height}
				handleClassName='commentNodeResizeHandle'
				lineClassName='commentNodeResizeLine'
			/>
			<div className={`commentNode ${selected ? 'commentNodeSelected' : ''}`}>
				<div className='commentNodeHeader'>
					<Icon name='comment' size={12} isSubtle />
					<span>{t('comment.badge')}</span>
					{data.onToggleComment && (
						<span className='commentNodeMinimize nodrag nopan'>
							<Tooltip content={t('comment.toggle.minimize')} placement='top'>
								<IconButton
									type='text'
									size='xs'
									iconProps={{ name: 'minimize', size: 12, isSubtle: true }}
									testId={`workflow-comment-minimize-${id}`}
									onClick={() => data.onToggleComment?.(id)}
								/>
							</Tooltip>
						</span>
					)}
				</div>
				{/* The textarea owns the pointer inside the node: `nodrag` keeps
				    selecting text from turning into a node drag, `nowheel` keeps
				    scrolling a long note from zooming the canvas. */}
				<textarea
					className='commentNodeText nodrag nowheel'
					value={data.comment?.text ?? ''}
					placeholder={t('comment.placeholder')}
					readOnly={!onChangeText}
					data-testid={`workflow-comment-text-${id}`}
					onChange={onTextChange}
				/>
			</div>
		</div>
	);
}
