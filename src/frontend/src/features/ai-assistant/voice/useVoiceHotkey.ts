import { useEffect, useEffectEvent } from 'react';

export const VOICE_HOTKEY = 'm';

/** Where a plain letter is text, not a shortcut: form fields, rich editors (Ace, CodeMirror), contenteditable. */
export function isTypingTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	if (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return true;
	return Boolean(target.closest('.ace_editor, .cm-editor, [contenteditable="true"]'));
}

const isPlainKey = (event: KeyboardEvent) =>
	event.key.toLowerCase() === VOICE_HOTKEY && !event.ctrlKey && !event.metaKey && !event.altKey && !event.repeat;

type Options = {
	isAvailable: boolean;
	isListening: boolean;
	/** E.g. a dialog is open: the palette behind it must not start listening. */
	isBlocked: () => boolean;
	onStart: () => void;
	onSend: () => void;
};

/**
 * "M" speaks a command: outside text fields it opens the palette and starts listening; while listening it sends, even
 * from the palette input (that M is a command, not a letter). A handled press is marked, so a second palette on the
 * page leaves it alone.
 */
export function useVoiceHotkey({ isAvailable, isListening, isBlocked, onStart, onSend }: Options) {
	const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
		if (!isPlainKey(event) || event.defaultPrevented) return;
		if (isListening) {
			event.preventDefault();
			onSend();
			return;
		}
		if (!isAvailable || event.shiftKey || isTypingTarget(event.target) || isBlocked()) return;
		event.preventDefault();
		onStart();
	});

	useEffect(() => {
		// Capture phase: while listening, the M must be taken before the focused palette input types it.
		const listener = (event: KeyboardEvent) => onKeyDown(event);
		window.addEventListener('keydown', listener, { capture: true });
		return () => window.removeEventListener('keydown', listener, { capture: true });
	}, []);
}
