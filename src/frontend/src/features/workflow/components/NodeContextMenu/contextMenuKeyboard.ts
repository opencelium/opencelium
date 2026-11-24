import type { KeyboardEvent } from 'react';

/** Arrow keys move between the menu's enabled buttons, wrapping at both ends. */
export const moveFocus = (event: KeyboardEvent<HTMLElement>) => {
	if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
	const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
	if (!buttons.length) return;
	event.preventDefault();
	const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
	const step = event.key === 'ArrowDown' ? 1 : -1;
	buttons[(current + step + buttons.length) % buttons.length].focus();
};
