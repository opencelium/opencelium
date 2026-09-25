import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import type { HeaderSaveDialogProps } from './HeaderSaveDialog.types';

const spinnerStyle = { ['--color-action-primary']: 'var(--color-text-on-action)' } as CSSProperties;

export function HeaderSaveDialog({
	open,
	value,
	onChange,
	onClose,
	onSave,
	saveDisabled = false,
	}: HeaderSaveDialogProps) {
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
