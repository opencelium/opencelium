import { Dialog } from '@shared/ui/primitives/Dialog';
import { Button } from '@shared/ui/primitives/Button';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type Props = {
	open: boolean;
	onCancel: () => void;
	onPasteInScope: () => void;
	onPasteAfter: () => void;
};

export const PasteOperatorDialog = ({ open, onCancel, onPasteInScope,
	onPasteAfter }: Props) => {
	const { t } = useI18n('workflow');
	return <Dialog open={open} onClose={onCancel} title={t('pasteOperator.title')}
		width={480} testId='workflow-paste-operator-dialog' footer={<>
			<Button variant='secondary' onClick={onCancel}>{t('actions.cancel')}</Button>
			<Button variant='secondary' onClick={onPasteAfter}>
				{t('pasteOperator.after')}
			</Button>
			<Button onClick={onPasteInScope}>{t('pasteOperator.inScope')}</Button>
		</>}>
		{t('pasteOperator.message')}
	</Dialog>;
};
