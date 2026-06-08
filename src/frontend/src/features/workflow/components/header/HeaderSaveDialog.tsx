import { useEffect } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type Props = {
	open: boolean;
	value: string;
	onChange: (value: string) => void;
	onClose: () => void;
	onSave: () => void;
	saveDisabled?: boolean;
};

export function HeaderSaveDialog({
	open,
	value,
	onChange,
	onClose,
	onSave,
	saveDisabled = false,
}: Props) {
	const { t } = useI18n('workflow');
	useEffect(() => {
		if (!open) return;
		const onEscape = (event: KeyboardEvent) =>
			event.key === 'Escape' && onClose();
		window.addEventListener('keydown', onEscape);
		return () => window.removeEventListener('keydown', onEscape);
	}, [onClose, open]);

	if (!open) return null;

	return (
		<div className='headerDialogOverlay' onClick={onClose}>
			<div
				className='headerDialog'
				onClick={(event) => event.stopPropagation()}
			>
				<div className='headerDialogTitle'>{t('saveDialog.title')}</div>
				<textarea
					className='headerDialogTextarea'
					placeholder={t('saveDialog.commentPlaceholder')}
					value={value}
					onChange={(event) => onChange(event.target.value)}
				/>
				<div className='headerDialogActions'>
					<button className='iconButton' type='button' onClick={onClose}>
						{t('actions.cancel')}
					</button>
					<button className='primaryButton' type='button' disabled={saveDisabled} onClick={onSave}>
						{t('actions.save')}
					</button>
				</div>
			</div>
		</div>
	);
}
