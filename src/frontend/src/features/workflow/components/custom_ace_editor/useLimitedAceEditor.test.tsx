import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useLimitedAceEditor } from './useLimitedAceEditor';

// Minimal stand-in for an Ace editor + session: `setValue` mutates the text and
// notifies listeners exactly like the real one, which is what makes the
// parent <-> editor echo reproducible here.
const createFakeEditor = (initialText: string) => {
	let text = initialText;
	const listeners: (() => void)[] = [];
	const session = {
		on: (_event: string, fn: () => void) => { listeners.push(fn); },
		off: (_event: string, fn: () => void) => {
			const index = listeners.indexOf(fn);
			if (index >= 0) listeners.splice(index, 1);
		},
	};
	const editor = {
		getValue: () => text,
		setValue: (next: string) => { text = next; listeners.forEach((fn) => fn()); },
		getSession: () => session,
		getSelectionRange: () => ({ end: 0 }),
		moveCursorToPosition: () => {},
	};
	return {
		editor,
		listenerCount: () => listeners.length,
		emitChange: (next: string) => {
			text = next;
			listeners.forEach((fn) => fn());
		},
		text: () => text,
	};
};

type Options = { value?: string; maxLength?: number; onChange?: (value: string) => void };

// The hook subscribes in an effect keyed on [maxLength, readOnly], so the fake
// editor is attached first and picked up by bumping maxLength.
const mountWithEditor = (fake: ReturnType<typeof createFakeEditor>, options: Options = {}) => {
	const onChange = options.onChange ?? vi.fn();
	const rendered = renderHook(
		({ maxLength, value }: { maxLength: number; value: string }) =>
			useLimitedAceEditor({ forwardedRef: null, maxLength, onChange, readOnly: false, value }),
		{ initialProps: { maxLength: (options.maxLength ?? 100) - 1, value: options.value ?? '' } },
	);
	act(() => { rendered.result.current.editorRef.current = { editor: fake.editor }; });
	rendered.rerender({ maxLength: options.maxLength ?? 100, value: options.value ?? '' });
	return { ...rendered, onChange };
};

describe('useLimitedAceEditor', () => {
	it('reports a real edit upward', () => {
		const fake = createFakeEditor('a');
		const { onChange, result } = mountWithEditor(fake, { value: 'a' });

		act(() => fake.emitChange('ab'));

		expect(onChange).toHaveBeenCalledWith('ab');
		expect(result.current.currentValue).toBe('ab');
	});

	it('does not report the change react-ace emits when it re-applies our own value', () => {
		const fake = createFakeEditor('a');
		const { onChange } = mountWithEditor(fake, { value: 'a' });

		// react-ace pushing the same text back into the session still fires
		// 'change'; treating that as an edit is what looped until React threw
		// "Maximum update depth exceeded".
		act(() => fake.emitChange('a'));

		expect(onChange).not.toHaveBeenCalled();
	});

	it('treats a value pushed down from the parent as synced, not as an edit', () => {
		const fake = createFakeEditor('a');
		const { onChange, rerender } = mountWithEditor(fake, { value: 'a' });

		rerender({ maxLength: 100, value: 'from-parent' });
		act(() => fake.emitChange('from-parent'));

		expect(onChange).not.toHaveBeenCalled();
	});

	it('still truncates past maxLength and reports the truncated text once', () => {
		const fake = createFakeEditor('');
		const { onChange, result } = mountWithEditor(fake, { value: '', maxLength: 4 });

		act(() => fake.emitChange('abcdefg'));

		expect(fake.text()).toBe('abcd');
		expect(onChange).toHaveBeenCalledWith('abcd');
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(result.current.currentValue).toBe('abcd');
	});

	it('keeps a single listener when the onChange identity changes every render', () => {
		const fake = createFakeEditor('a');
		const rendered = renderHook(
			({ maxLength, value }: { maxLength: number; value: string }) =>
				useLimitedAceEditor({ forwardedRef: null, maxLength,
					onChange: () => {}, readOnly: false, value }),
			{ initialProps: { maxLength: 99, value: 'a' } },
		);
		act(() => { rendered.result.current.editorRef.current = { editor: fake.editor }; });
		rendered.rerender({ maxLength: 100, value: 'a' });

		for (let index = 0; index < 5; index += 1) rendered.rerender({ maxLength: 100, value: 'a' });

		expect(fake.listenerCount()).toBe(1);
	});
});
