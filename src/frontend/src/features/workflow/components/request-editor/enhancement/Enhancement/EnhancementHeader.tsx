import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type Props = {
	canDelete: boolean;
	readOnly?: boolean;
	onDelete?: () => void;
};

export function EnhancementHeader({ canDelete, readOnly, onDelete }: Props) {
	const { t } = useI18n('workflow');
	const confirm = useConfirm();
	return <div className='bodyLegacyEnhancementHeader'>
		<span>{t('enhancement.title')}</span>
		{onDelete && <span onClick={async (event) => {
			event.stopPropagation();
			const confirmed = await confirm({
				title: t('enhancement.confirmDelete.title'),
				message: t('enhancement.confirmDelete.message'),
			});
			if (confirmed) onDelete();
		}}>
			<Tooltip content={t(canDelete ? 'actions.deleteEnhancement'
				: 'enhancement.deleteDisabledMultipleReferences')}>
				<DeleteIconButton iconSize={15} disabled={readOnly || !canDelete}
					testId='workflow-enhancement-delete' />
			</Tooltip>
		</span>}
	</div>;
}
