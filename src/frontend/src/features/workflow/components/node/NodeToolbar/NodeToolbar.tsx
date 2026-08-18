import { Unlink } from 'lucide-react';
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { NodeToolbarProps } from './NodeToolbar.types';

export function NodeToolbar({ canDelete, onDelete, canRemoveJoint, onRemoveJoint }: NodeToolbarProps) {
	const { t } = useI18n('workflow');
	if (!canDelete && !canRemoveJoint) return null;

	return (
		<div className='nodeToolbar'>
			{canRemoveJoint && (
				<Tooltip content={t('actions.removeJoint')}>
					<button
						type='button'
						onClick={onRemoveJoint}
						data-testid='workflow-node-remove-joint'
						style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 2 }}
					>
						<Unlink size={14} />
					</button>
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
