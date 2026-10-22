import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';

type Props = {
	canApply: boolean;
	onApply: () => void;
	onClose: () => void;
};

export function PlaygroundFooter({ canApply, onApply, onClose }: Props) {
	const { t } = useI18n('workflow');
	return (
		<div className='rpFooter'>
			<span className='rpHint rpFooterHint'>{t('requestPlayground.footer.hint')}</span>
			<Button onClick={onApply} disabled={!canApply} testId='request-playground-apply'>
				{t('requestPlayground.footer.apply')}
			</Button>
			<Button type='primary' onClick={onClose} testId='request-playground-close'>
				{t('requestPlayground.footer.close')}
			</Button>
		</div>
	);
}
