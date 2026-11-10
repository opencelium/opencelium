import { useEffect, useRef } from 'react';

/** Closes an open menu on a press outside `ref` (the trigger included in it, so the trigger can toggle) or on Escape. */
export function useMenuDismiss(isOpen: boolean, onClose: () => void) {
	const ref = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		if (!isOpen) return undefined;
		const onPointerDown = (event: PointerEvent) => {
			if (!ref.current?.contains(event.target as Node)) onClose();
		};
		const onEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose();
		};
		window.addEventListener('pointerdown', onPointerDown, true);
		window.addEventListener('keydown', onEscape);
		return () => {
			window.removeEventListener('pointerdown', onPointerDown, true);
			window.removeEventListener('keydown', onEscape);
		};
	}, [isOpen, onClose]);
	return ref;
}
