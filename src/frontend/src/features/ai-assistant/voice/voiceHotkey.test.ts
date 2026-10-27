import { describe, expect, it } from 'vitest';
import { isTypingTarget } from './useVoiceHotkey';

describe('isTypingTarget', () => {
	it('treats form fields, editors and contenteditable as typing', () => {
		const editor = document.createElement('div');
		editor.className = 'ace_editor';
		const inner = document.createElement('span');
		editor.appendChild(inner);
		const editable = document.createElement('div');
		editable.setAttribute('contenteditable', 'true');
		document.body.append(editor, editable);
		expect(isTypingTarget(document.createElement('input'))).toBe(true);
		expect(isTypingTarget(document.createElement('textarea'))).toBe(true);
		expect(isTypingTarget(inner)).toBe(true);
		expect(isTypingTarget(editable)).toBe(true);
	});

	it('lets the shortcut through anywhere else', () => {
		expect(isTypingTarget(document.body)).toBe(false);
		expect(isTypingTarget(document.createElement('button'))).toBe(false);
		expect(isTypingTarget(null)).toBe(false);
	});
});
