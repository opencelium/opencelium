import { describe, expect, it } from 'vitest';
import { truncateCellText } from './Table.utils';

const MAX_WORD_LENGTH = 50;
const MAX_TEXT_LENGTH = 150;

describe('truncateCellText', () => {
    it('leaves text within both limits untouched', () => {
        const text = 'A perfectly ordinary connection description.';
        expect(truncateCellText(text)).toBe(text);
    });

    it('caps a single unbreakable token at the word limit', () => {
        const shortened = truncateCellText('t'.repeat(400));
        expect(shortened).toBe(`${'t'.repeat(MAX_WORD_LENGTH)}…`);
    });

    it('cuts the long token in place and keeps the words around it', () => {
        const shortened = truncateCellText(`failed on ${'a'.repeat(200)} while saving`);
        expect(shortened).toBe(`failed on ${'a'.repeat(MAX_WORD_LENGTH)}… while saving`);
    });

    it('caps wrappable text at the text limit', () => {
        const text = 'word '.repeat(80);
        const shortened = truncateCellText(text);
        expect(shortened).toBe(`${text.slice(0, MAX_TEXT_LENGTH)}…`);
        expect(shortened.length).toBe(MAX_TEXT_LENGTH + 1);
    });

    it('applies both limits to text that breaks both', () => {
        const shortened = truncateCellText(`${'word '.repeat(40)}${'x'.repeat(300)}`);
        expect(shortened.length).toBe(MAX_TEXT_LENGTH + 1);
        // The token was cut where it sat, so the cap lands on already-shortened text.
        expect(shortened).not.toContain('x'.repeat(MAX_WORD_LENGTH + 1));
    });

    it('keeps a token exactly at the limit', () => {
        const text = 'a'.repeat(MAX_WORD_LENGTH);
        expect(truncateCellText(text)).toBe(text);
    });

    it('handles empty text', () => {
        expect(truncateCellText('')).toBe('');
    });
});
