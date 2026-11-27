import { useEffect, type RefObject } from 'react';
import { isInEditorPopupLayer } from '../request-editor/editorPopupLayers';

/** While `isActive`, a mouse-down outside `ref` (and outside any open dropdown) calls `onSettle`. */
export const useSettleOnOutsideClick = (ref: RefObject<HTMLElement | null>, isActive: boolean, onSettle: () => void) => {
	useEffect(() => {
		if (!isActive) return;
		const onMouseDown = (event: MouseEvent) => {
			const target = event.target as Element | null;
			if (!target || ref.current?.contains(target) || isInEditorPopupLayer(target)) return;
			onSettle();
		};
		document.addEventListener('mousedown', onMouseDown, true);
		return () => document.removeEventListener('mousedown', onMouseDown, true);
	}, [isActive, onSettle, ref]);
};
