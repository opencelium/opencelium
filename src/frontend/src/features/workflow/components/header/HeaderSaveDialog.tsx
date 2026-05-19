import { useEffect } from 'react';

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
				<div className='headerDialogTitle'>Save Version</div>
				<textarea
					className='headerDialogTextarea'
					placeholder='Comment'
					value={value}
					onChange={(event) => onChange(event.target.value)}
				/>
				<div className='headerDialogActions'>
					<button className='iconButton' type='button' onClick={onClose}>
						Cancel
					</button>
					<button className='primaryButton' type='button' disabled={saveDisabled} onClick={onSave}>
						Save
					</button>
				</div>
			</div>
		</div>
	);
}
