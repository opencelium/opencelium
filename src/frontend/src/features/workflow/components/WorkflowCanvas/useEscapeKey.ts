import { useEffect } from 'react';

/**
 * Escape, while `enabled`. The canvas has several things this key dismisses —
 * a failed run's highlight, a joint being drawn, an error ring — and each is
 * mounted only while it has something to dismiss, so one listener per concern
 * stays cheaper to read than one handler that has to know about all of them.
 *
 * A node's own input can keep the key by stopping propagation (see
 * LoopIterationInput): these listeners sit above React's root container.
 */
export const useEscapeKey = (enabled: boolean, onEscape?: () => void) => {
	useEffect(() => {
		if (!enabled || !onEscape) return;
		const handle = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onEscape();
		};
		window.addEventListener('keydown', handle);
		return () => window.removeEventListener('keydown', handle);
	}, [enabled, onEscape]);
};
