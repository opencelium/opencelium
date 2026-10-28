import { describe, expect, it } from 'vitest';
import { readEvents } from '../api/helpStream';
import { AI_ITEM, firstActionableAiItem } from '../command/aiCommandItemValues';
import { useAssistantStore } from './assistantStore';
import { splitCitations } from './citations';

const source = { n: 1, title: 'Schedule and notify › Notifications', url: 'https://docs.opencelium.io/en/prod/guides/schedule-and-notify.html#notifications' };

describe('splitCitations', () => {
	it('turns cited numbers into links and leaves numbers without a source as text', () => {
		expect(splitCitations('Use the alert event [1]. See [3].', [source])).toEqual([
			{ kind: 'text', text: 'Use the alert event ' },
			{ kind: 'citation', source },
			{ kind: 'text', text: '. See [3].' },
		]);
	});
});

describe('readEvents', () => {
	it('reads complete lines and keeps an unfinished one for the next piece', () => {
		const first = readEvents('{"type":"delta","text":"Use "}\n{"type":"de');
		expect(first.events).toEqual([{ type: 'delta', text: 'Use ' }]);
		expect(readEvents(`${first.rest}lta","text":"it"}\n`).events).toEqual([{ type: 'delta', text: 'it' }]);
	});
});

describe('assistant store', () => {
	it('hands a question over once and a command to the palette once, closing the panel for it', () => {
		const store = useAssistantStore.getState();
		store.open('  How do I add a notification?  ');
		expect(useAssistantStore.getState().isOpen).toBe(true);
		expect(store.takePendingQuestion()).toBe('How do I add a notification?');
		expect(store.takePendingQuestion()).toBeNull();
		store.runInPalette('create notification template');
		expect(useAssistantStore.getState().isOpen).toBe(false);
		expect(store.takePaletteRequest()).toBe('create notification template');
		expect(store.takePaletteRequest()).toBeNull();
	});
});

describe('Enter on a question', () => {
	it('opens the assistant, even when a command fits too', () => {
		const proposal = { kind: 'no-command' as const, reply: '' };
		expect(firstActionableAiItem({ status: 'done', prompt: 'how?', proposal, isQuestion: true })).toBe(AI_ITEM.askAssistant);
		expect(firstActionableAiItem({ status: 'done', prompt: 'x', proposal, isQuestion: false })).toBeUndefined();
	});
});
