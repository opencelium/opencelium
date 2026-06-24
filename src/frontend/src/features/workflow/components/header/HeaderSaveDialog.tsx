import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Loading } from '@shared/ui/primitives/Loading/Loading';

type Props = {
	open: boolean;
	value: string;
	onChange: (value: string) => void;
	onClose: () => void;
	onSave: () => void | Promise<void>;
	saveDisabled?: boolean;
};

// Render the spinner dots in the on-action color so they stay visible on the
// primary-filled save button (they default to --color-action-primary).
const spinnerStyle = { ['--color-action-primary']: 'var(--color-text-on-action)' } as CSSProperties;

export function HeaderSaveDialog({
	open,
	value,
	onChange,
	onClose,
	onSave,
	saveDisabled = false,
}: Props) {
	const { t } = useI18n('workflow');
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (!open) return;
		const onEscape = (event: KeyboardEvent) =>
			event.key === 'Escape' && !isSaving && onClose();
		window.addEventListener('keydown', onEscape);
		return () => window.removeEventListener('keydown', onEscape);
	}, [isSaving, onClose, open]);

	if (!open) return null;

	const handleSave = async () => {
		if (isSaving) return;
		setIsSaving(true);
		try {
			await onSave();
		} catch {
			// Error surfaced by the save handler (toast); keep the dialog open to retry.
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className='headerDialogOverlay' onClick={isSaving ? undefined : onClose}>
			<div
				className='headerDialog'
				onClick={(event) => event.stopPropagation()}
			>
				<div className='headerDialogTitle'>{t('saveDialog.title')}</div>
				<textarea
					autoFocus
					className='headerDialogTextarea'
					placeholder={t('saveDialog.commentPlaceholder')}
					value={value}
					onChange={(event) => onChange(event.target.value)}
				/>
				<div className='headerDialogActions'>
					<button className='iconButton' type='button' disabled={isSaving} onClick={onClose}>
						{t('actions.cancel')}
					</button>
					<button className='primaryButton' type='button' disabled={saveDisabled || isSaving} onClick={handleSave}>
						{isSaving ? <Loading inline size='xs' style={spinnerStyle} /> : null}
						{t('actions.save')}
					</button>
				</div>
			</div>
		</div>
	);
}
