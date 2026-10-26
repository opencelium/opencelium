import { describe, expect, it } from 'vitest';
import { hasPlanSteps, planToText } from './planText.utils';

describe('planToText', () => {
	it('writes one bulleted line per step, indented two spaces per level', () => {
		expect(planToText([{ text: 'Read', depth: 0 }, { text: 'For each', depth: 0 }, { text: 'Create', depth: 1 }]))
			.toBe('- Read\n- For each\n  - Create');
	});
});

describe('hasPlanSteps', () => {
	it.each([['- Read', true], ['  - ', false], ['', false], ['\n- \n  x', true]])('%j → %s', (text, expected) => {
		expect(hasPlanSteps(text)).toBe(expected);
	});
});
