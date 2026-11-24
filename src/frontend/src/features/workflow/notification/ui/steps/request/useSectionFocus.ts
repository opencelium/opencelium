import { useCallback, useEffect, useRef } from 'react';
import type { NotificationRequestSection } from '../../../model/notification.types';
import type { NotificationSectionFocus } from '../../dialog/useNotificationDialog';

const HIGHLIGHT_CLASS = 'notificationSectionHighlight';
const HIGHLIGHT_MS = 1600;

/** Scrolls the requested section into view and flashes it once (context-menu "Request → URL/Header/Body"). */
export const useSectionFocus = (focus: NotificationSectionFocus | null, onDone: () => void) => {
	const elements = useRef(new Map<NotificationRequestSection, HTMLElement>());

	useEffect(() => {
		if (!focus) return;
		const element = elements.current.get(focus.section);
		if (!element) return;
		element.scrollIntoView({ block: 'center', behavior: 'smooth' });
		element.classList.add(HIGHLIGHT_CLASS);
		const timer = window.setTimeout(() => {
			element.classList.remove(HIGHLIGHT_CLASS);
			onDone();
		}, HIGHLIGHT_MS);
		return () => {
			window.clearTimeout(timer);
			element.classList.remove(HIGHLIGHT_CLASS);
		};
	}, [focus, onDone]);

	return useCallback((section: NotificationRequestSection) => (element: HTMLElement | null) => {
		if (element) elements.current.set(section, element);
		else elements.current.delete(section);
	}, []);
};
