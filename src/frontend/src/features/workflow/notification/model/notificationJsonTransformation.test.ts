import { describe, expect, it } from 'vitest';
import type { FieldBinding } from '../../types/connection';
import { createNotificationConfig, selectTool, updateActiveDraft } from './notificationConfig';
import {
	buildTransformationResultVar, createTransformationEnhancement, findJsonTransformation, reconcileTransformationBindings,
} from './notificationBindings';
import {
	listJsonReferenceFields, parseBindingPath, toBindingPath, writeJsonPath,
} from './notificationBodyPath';
import type { NotificationConfig } from './notification.types';

const COLOR = '#3fa9f5';
const ID = `{%${COLOR}.(response).body.$.id%}`;
const STATE = `{%${COLOR}.(response).body.$.state%}`;
const FACT_PATH = ['attachments', '0', 'content', 'body', '2', 'facts', '0', 'value'];

const genericWith = (body: unknown): NotificationConfig =>
	updateActiveDraft(selectTool(createNotificationConfig(), 'generic'), (draft) => ({ ...draft, jsonOverride: JSON.stringify(body) }));

describe('notification body paths', () => {
	it('joins each array index to its key, the form the backend splits correctly', () => {
		expect(toBindingPath(FACT_PATH)).toBe('attachments[0].content.body[2].facts[0].value');
		expect(toBindingPath(['0', 'text'])).toBe('[0].text');
		expect(buildTransformationResultVar(COLOR, ['blocks', '1', 'text', 'text'])).toBe(`${COLOR}.(request).body.$.blocks[1].text.text`);
	});

	it('reads both the joined and the older dotted form back to segments', () => {
		expect(parseBindingPath('attachments[0].content.body[2].facts[0].value')).toEqual(FACT_PATH);
		expect(parseBindingPath('attachments.[0].content.body.[2].facts.[0].value')).toEqual(FACT_PATH);
		expect(parseBindingPath('.[0].text')).toEqual(['0', 'text']);
		expect(parseBindingPath('matrix[1][2]')).toEqual(['matrix', '1', '2']);
	});

	it('lists the text values that hold a reference, or null while the JSON does not parse', () => {
		const body = { text: `Order ${ID}`, plain: 'Hi', count: 3, items: [{ title: 'x', value: STATE }], region: '{{global.region}}' };
		expect(listJsonReferenceFields(JSON.stringify(body))).toEqual([
			{ path: ['text'], value: `Order ${ID}` },
			{ path: ['items', '0', 'value'], value: STATE },
			{ path: ['region'], value: '{{global.region}}' },
		]);
		expect(listJsonReferenceFields('{"text": ')).toBeNull();
	});

	it('writes one value back and leaves the rest of the JSON as it was', () => {
		const next = writeJsonPath(JSON.stringify({ a: 1, items: [{ v: 'x' }, { v: 'y' }] }), ['items', '1', 'v'], ID);
		expect(JSON.parse(next ?? '')).toEqual({ a: 1, items: [{ v: 'x' }, { v: ID }] });
		expect(writeJsonPath('not json', ['a'], ID)).toBeNull();
	});
});

describe('notification transformations in hand-edited JSON', () => {
	const bindingAt = (resultVar: string, value: string): FieldBinding => ({ enhancement: createTransformationEnhancement(resultVar, value) });

	it('finds the transformation of a value by its path, in either path form and any color case', () => {
		const joined = bindingAt(buildTransformationResultVar(COLOR, FACT_PATH), STATE);
		const dotted = bindingAt(`${COLOR.toUpperCase()}.(request).body.$.text`, STATE);
		expect(findJsonTransformation([joined, dotted], COLOR, FACT_PATH)).toBe(joined.enhancement.enhanceId);
		expect(findJsonTransformation([joined, dotted], COLOR, ['text'])).toBe(dotted.enhancement.enhanceId);
		expect(findJsonTransformation([joined], COLOR, ['other'])).toBeUndefined();
	});

	it('takes the inputs of the value it fills and rewrites an older dotted path', () => {
		const older = bindingAt(`${COLOR}.(request).body.$.items.[0].value`, STATE);
		const config = genericWith({ items: [{ value: `${ID} ${STATE}` }] });
		const [next] = reconcileTransformationBindings({ config, color: COLOR, bindings: [older], transformations: {} });
		expect(next.enhancement.args).toEqual({
			RESULT_VAR: `${COLOR}.(request).body.$.items[0].value`,
			VAR_0: `${COLOR}.(response).body.$.id`,
			VAR_1: `${COLOR}.(response).body.$.state`,
		});
		expect(next.enhancement.enhanceId).toBe(older.enhancement.enhanceId);
	});

	it('hands back an untouched binding as it got it', () => {
		const binding = bindingAt(buildTransformationResultVar(COLOR, ['text']), STATE);
		const config = genericWith({ text: STATE });
		expect(reconcileTransformationBindings({ config, color: COLOR, bindings: [binding], transformations: {} })[0]).toBe(binding);
	});

	it('goes when its path no longer holds a step reference', () => {
		const binding = bindingAt(buildTransformationResultVar(COLOR, ['text']), STATE);
		expect(reconcileTransformationBindings({ config: genericWith({ message: STATE }), color: COLOR,
			bindings: [binding], transformations: {} })).toEqual([]);
	});
});
