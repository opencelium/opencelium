import { expect, it, vi } from 'vitest';
import { findEditorPlaygroundOpener, registerEditorPlaygroundOpener } from './editorPlaygroundOpener';

it('finds the open editor only for its own workflow and forgets it once unregistered', () => {
	const open = vi.fn();
	const unregister = registerEditorPlaygroundOpener({ connectionId: 7, open });
	expect(findEditorPlaygroundOpener(7)).toBe(open);
	expect(findEditorPlaygroundOpener(8)).toBeNull();
	unregister();
	expect(findEditorPlaygroundOpener(7)).toBeNull();
});

it('keeps a newer registration when an older editor unregisters late', () => {
	const unregisterOld = registerEditorPlaygroundOpener({ connectionId: 7, open: vi.fn() });
	const open = vi.fn();
	registerEditorPlaygroundOpener({ connectionId: 7, open });
	unregisterOld();
	expect(findEditorPlaygroundOpener(7)).toBe(open);
});
