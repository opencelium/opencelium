import { Button } from '@shared/ui/primitives/Button';
import { Hint } from '@shared/ui/primitives/Hint';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type BindingDrawerDirectReferenceProps = {
	/** Absent when the field's value cannot become an enhancement (text around
	 *  its reference) or the workflow is read-only. */
	onCreateEnhancement?: () => void;
};

export function BindingDrawerDirectReference({ onCreateEnhancement }: BindingDrawerDirectReferenceProps) {
	const { t } = useI18n('workflow');
	return (
		<div className='bindingDrawerNote'>
			<Hint noPrefix>{t('bindingLens.drawerValueReference')}</Hint>
			<Button
				type='primary'
				className='bindingDrawerCreateButton'
				disabled={!onCreateEnhancement}
				onClick={onCreateEnhancement}
				testId='workflow-binding-drawer-create-enhancement'
			>
				{t('actions.createEnhancement')}
			</Button>
		</div>
	);
}
