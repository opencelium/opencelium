import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { NodeToolbarProps } from './NodeToolbar.types';

export function NodeToolbar({ canDelete, onDelete }: NodeToolbarProps) {
	const { t } = useI18n('workflow');
	if (!canDelete) return null;

	return (
		<div className='nodeToolbar'>
			<Tooltip content={t('actions.delete')}>
				<DeleteIconButton iconSize={14} onClick={onDelete} testId='workflow-node-delete' />
			</Tooltip>
		</div>
	);
}
