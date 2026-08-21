import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { NodeToolbarProps } from './NodeToolbar.types';

export function NodeToolbar({ canDelete, canComment, canRemoveJoint, onDelete, onComment, onRemoveJoint }: NodeToolbarProps) {
	const { t } = useI18n('workflow');
	if (!canDelete && !canComment && !canRemoveJoint) return null;

	return (
		<div className='nodeToolbar'>
			{canRemoveJoint && (
				<Tooltip content={t('actions.removeJoint')}>
					<IconButton
						type='text'
						size='xs'
						iconProps={{ name: 'unlink', size: 14 }}
						onClick={onRemoveJoint}
						testId='workflow-node-remove-joint'
					/>
				</Tooltip>
			)}
			{canComment && (
				<Tooltip content={t('comment.add')}>
					<IconButton
						type='text'
						size='xs'
						iconProps={{ name: 'comment', size: 14 }}
						onClick={onComment}
						testId='workflow-node-add-comment'
					/>
				</Tooltip>
			)}
			{canDelete && (
				<Tooltip content={t('actions.delete')}>
					<DeleteIconButton iconSize={14} onClick={onDelete} testId='workflow-node-delete' />
				</Tooltip>
			)}
		</div>
	);
}
