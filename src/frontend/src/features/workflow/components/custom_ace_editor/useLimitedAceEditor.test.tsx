import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useEffect, useState } from 'react';
import { useLimitedAceEditor } from './useLimitedAceEditor';

/**
 * Stand-in for an ace editor wrapped by react-ace, faithful in the two ways that
 * caused the loop this hook exists to avoid:
 *
 *  - ace's `Document.setValue` is a remove followed by an insert, so it signals
 *    'change' twice, with an EMPTY document in between;
 *  - react-ace hides the echo of its own programmatic push behind a `silent`
 *    flag, and calls its `onChange` prop for everything else.
 */
const createFakeAce = (initialText: string) => {
	let text = initialText;
	let silent = false;
	let reportChange: ((value: string) => void) | undefined;
	const signalChange = () => { if (!silent) reportChange?.(text); };
	const editor = {
		getValue: () => text,
		setValue: (next: string) => {
			text = '';
			signalChange();
			text = next;
			signalChange();
		},
		getSession: () => ({ on: () => {}, off: () => {} }),
		getSelectionRange: () => ({ end: 0 }),
		moveCursorToPosition: () => {},
	};
	return {
		editor,
		text: () => text,
		attach: (handler: (value: string) => void) => { reportChange = handler; },
		/** The user typing: ace mutates the document and react-ace reports it. */
		type: (next: string) => { text = next; signalChange(); },
		/** react-ace's componentDidUpdate pushing the `value` prop back in. */
		pushProp: (next: string) => {
			if (text === next) return;
			silent = true;
			editor.setValue(next);
			silent = false;
		},
	};
};

type Options = { value?: string; maxLength?: number; onChange?: (value: string) => void };

const mountWithEditor = (fake: ReturnType<typeof createFakeAce>, options: Options = {}) => {
	const onChange = options.onChange ?? vi.fn();
	const rendered = renderHook(
		({ maxLength, value }: { maxLength?: number; value: string }) =>
			useLimitedAceEditor({ forwardedRef: null, maxLength, onChange, readOnly: false, value }),
		{ initialProps: { maxLength: options.maxLength, value: options.value ?? '' } },
	);
	act(() => {
		rendered.result.current.editorRef.current = { editor: fake.editor };
		fake.attach((next) => rendered.result.current.onEditorChange(next));
	});
	return { ...rendered, onChange };
};

describe('useLimitedAceEditor', () => {
	it('reports a real edit upward', () => {
		const fake = createFakeAce('a');
		const { onChange, result } = mountWithEditor(fake, { value: 'a' });

		act(() => fake.type('ab'));

		expect(onChange).toHaveBeenCalledWith('ab');
		expect(result.current.currentValue).toBe('ab');
	});

	it('says nothing when react-ace re-applies the value the parent pushed down', () => {
		const fake = createFakeAce('a');
		const { onChange, rerender } = mountWithEditor(fake, { value: 'a' });

		rerender({ maxLength: 100, value: 'from-parent' });
		act(() => fake.pushProp('from-parent'));

		expect(onChange).not.toHaveBeenCalled();
		expect(fake.text()).toBe('from-parent');
	});

	it('never reports the empty document a programmatic write passes through', () => {
		const fake = createFakeAce('abcdefg');
		const { onChange } = mountWithEditor(fake, { value: 'abcdefg', maxLength: 4 });

		// The truncating setValue below signals 'change' with an empty document
		// first. Reporting that upward is what the parent stored, pushed back
		// down, and bounced until React threw "Maximum update depth exceeded".
		act(() => fake.type('abcdefg'));

		expect(onChange).not.toHaveBeenCalledWith('');
	});

	it('still truncates past maxLength and reports the truncated text once', () => {
		const fake = createFakeAce('');
		const { onChange, result } = mountWithEditor(fake, { value: '', maxLength: 4 });

		act(() => fake.type('abcdefg'));

		expect(fake.text()).toBe('abcd');
		expect(onChange).toHaveBeenCalledWith('abcd');
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(result.current.currentValue).toBe('abcd');
	});

	it('settles instead of looping when the parent mirrors every reported value', () => {
		const fake = createFakeAce('a');
		const seen: string[] = [];
		const rendered = renderHook(({ maxLength }: { maxLength: number }) => {
			const [parentValue, setParentValue] = useState('a');
			const hook = useLimitedAceEditor({
				forwardedRef: null, maxLength, readOnly: false, value: parentValue,
				onChange: (next) => { seen.push(next); setParentValue(next); },
			});
			// What react-ace's componentDidUpdate does with the value it is given.
			useEffect(() => { fake.pushProp(hook.currentValue ?? ''); });
			return hook;
		}, { initialProps: { maxLength: 4 } });
		act(() => {
			rendered.result.current.editorRef.current = { editor: fake.editor };
			fake.attach((next) => rendered.result.current.onEditorChange(next));
		});

		act(() => fake.type('abcdefg'));

		expect(seen).toEqual(['abcd']);
		expect(fake.text()).toBe('abcd');
		expect(rendered.result.current.currentValue).toBe('abcd');
	});

	it('leaves the text alone when there is no length limit', () => {
		const fake = createFakeAce('');
		const { onChange } = mountWithEditor(fake, { value: '' });

		act(() => fake.type('a'.repeat(500)));

		expect(fake.text()).toBe('a'.repeat(500));
		expect(onChange).toHaveBeenCalledWith('a'.repeat(500));
	});
});
