import { describe, expect, it } from 'vitest';
import { buildReferencePreview } from '../../model/bodyPreview';
import { paintParts, readRawText, replaceChipWithCaret, restoreChips } from './referenceTextDom';

const URL = '{url}/user?test={%#C77E7E.(response).body.$.[-1].id%}';

const paint = (value: string) => {
	const root = document.createElement('div');
	paintParts(root, buildReferencePreview(value), 'Set reference');
	return root;
};

describe('referenceTextDom', () => {
	it('shows each reference as a placeholder chip and never its raw text', () => {
		expect(paint(URL).textContent?.replace(/\u200B/g, '')).toBe('{url}/user?test=Set reference');
	});

	it('reads the edited text back with every chip as the reference it stands for', () => {
		const root = paint(URL);
		root.append(document.createTextNode('&page=2'));
		expect(readRawText(root)).toBe(`${URL}&page=2`);
	});

	it('removes a clicked chip and puts the caret where it was', () => {
		const root = paint(URL);
		document.body.append(root);
		const removed = replaceChipWithCaret(root, root.querySelector<HTMLElement>('[data-raw]')!);
		expect(readRawText(root)).toBe('{url}/user?test=');
		expect(restoreChips(readRawText(root), [removed])).toBe(URL);
		const range = window.getSelection()!.getRangeAt(0);
		expect(range.collapsed).toBe(true);
		expect(range.startContainer).toBe(root);
		expect(range.startOffset).toBe(1);
		root.remove();
	});

	it('restores several removed references to their own places', () => {
		const text = 'a{%#aaaaaa.(response).status%}b{%#bbbbbb.(response).status%}c';
		const root = paint(text);
		document.body.append(root);
		const first = replaceChipWithCaret(root, root.querySelector<HTMLElement>('[data-raw]')!);
		const second = replaceChipWithCaret(root, root.querySelector<HTMLElement>('[data-raw]')!);
		expect(readRawText(root)).toBe('abc');
		expect(restoreChips('abc', [first, second])).toBe(text);
		root.remove();
	});
});
