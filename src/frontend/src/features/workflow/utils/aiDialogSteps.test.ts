import { describe, expect, it } from 'vitest';
import { createAiDialogSteps } from './aiDialogSteps';

const steps = () => createAiDialogSteps<string>((draft) => draft);
const shape = (taken: { draft: string; origin: string }[]) => taken.map(({ draft, origin }) => `${origin}:${draft}`);

describe('createAiDialogSteps', () => {
	it('records an AI apply on an untouched dialog as one AI step', () => {
		const recorder = steps();
		recorder.start('a');
		recorder.record('a', 'b');
		expect(shape(recorder.take())).toEqual(['ai:b']);
	});

	it('keeps the user\'s edits before an AI apply as a step of their own', () => {
		const recorder = steps();
		recorder.start('a');
		recorder.record('a+user', 'mapped');
		recorder.record('mapped', 'scripted');
		expect(shape(recorder.take())).toEqual(['user:a+user', 'ai:mapped', 'ai:scripted']);
	});

	it('forgets an AI apply that was undone', () => {
		const recorder = steps();
		recorder.start('a');
		const forget = recorder.record('a', 'b');
		forget();
		recorder.record('a', 'c');
		expect(shape(recorder.take())).toEqual(['ai:c']);
	});

	it('starts over for each dialog session', () => {
		const recorder = steps();
		recorder.start('a');
		recorder.record('a', 'b');
		recorder.start('x');
		expect(recorder.take()).toEqual([]);
	});
});
