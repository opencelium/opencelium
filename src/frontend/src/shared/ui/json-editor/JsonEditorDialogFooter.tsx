import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';

type Props = {
	testId: string;
	readOnly: boolean;
	isDirty: boolean;
	hasError: boolean;
	isApplying: boolean;
	canForceApply: boolean | null;
	onForceApply: () => void;
	onCancel: () => void;
	onReset: () => void;
	onApply: () => void;
};

export function JsonEditorDialogFooter({ testId, readOnly, isDirty, hasError, isApplying,
	canForceApply, onForceApply, onCancel, onReset, onApply }: Props) {
	const { t } = useI18n('common');
	return <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
		{!readOnly && canForceApply !== null
			? <Button variant="danger" color="danger" type="primary"
				testId={`${testId}-force-apply`}
				disabled={!isDirty || !canForceApply || isApplying}
				onClick={onForceApply}>{t('jsonEditor.forceApply')}</Button>
			: <span />}
		<div style={{ display: 'flex', gap: 8 }}>
			<Button testId={`${testId}-cancel`} disabled={isApplying}
				onClick={onCancel}>{t('jsonEditor.cancel')}</Button>
			{!readOnly && <>
			<Button testId={`${testId}-reset`} disabled={!isDirty || isApplying}
				onClick={onReset}>{t('jsonEditor.reset')}</Button>
			<Button type="primary" testId={`${testId}-apply`} loading={isApplying}
				disabled={!isDirty || hasError}
				onClick={onApply}>{t('jsonEditor.apply')}</Button>
			</>}
		</div>
	</div>;
}
