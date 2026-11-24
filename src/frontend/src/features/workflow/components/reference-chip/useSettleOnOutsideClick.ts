import { useEffect, type RefObject } from 'react';

// Select dropdowns and pickers render in portals outside the host; clicks there are still "inside".
const POPUP_SELECTOR = '.ant-select-dropdown, .ant-picker-dropdown, .bodyLegacyWebhookModalRoot, .ant-modal-wrap .bodyLegacyWebhookModal';

/** While `isActive`, a mouse-down outside `ref` (and outside any open dropdown) calls `onSettle`. */
export const useSettleOnOutsideClick = (ref: RefObject<HTMLElement | null>, isActive: boolean, onSettle: () => void) => {
	useEffect(() => {
		if (!isActive) return;
		const onMouseDown = (event: MouseEvent) => {
			const target = event.target as Element | null;
			if (!target || ref.current?.contains(target) || target.closest(POPUP_SELECTOR)) return;
			onSettle();
		};
		document.addEventListener('mousedown', onMouseDown, true);
		return () => document.removeEventListener('mousedown', onMouseDown, true);
	}, [isActive, onSettle, ref]);
};
