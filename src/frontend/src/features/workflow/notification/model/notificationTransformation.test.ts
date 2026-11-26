import { describe, expect, it } from 'vitest';
import { serializeWorkflowFieldBindings } from '../../api/connectionPayload.fieldBindings';
import type { FieldBinding } from '../../types/connection';
import { createFact, selectTool, createNotificationConfig, updateActiveDraft } from './notificationConfig';
import {
	buildTransformationResultVar, createTransformationEnhancement, matchTransformations, reconcileTransformationBindings,
} from './notificationBindings';
import {
	buildTemplateScript, getTransformationArgs, getTransformationAvailability, toTransformedValue,
} from './notificationTransformation';
import { locateTransformTarget, transformTargetId } from './notificationTransformTargets';
import type { NotificationConfig, NotificationMessageValues, NotificationToolId } from './notification.types';

const COLOR = '#3fa9f5';
const ID = `{%${COLOR}.(response).body.$.id%}`;
const STATE = `{%${COLOR}.(response).body.$.state%}`;

const configFor = (toolId: NotificationToolId, message: NotificationMessageValues): NotificationConfig =>
	updateActiveDraft(selectTool(createNotificationConfig(), toolId), (draft) => ({ ...draft, message: { ...draft.message, ...message } }));

const resultVarOf = (bindings: FieldBinding[], index = 0) => bindings[index].enhancement.args.RESULT_VAR;

describe('notification transformation values', () => {
	it('builds a first script that reproduces the field text', () => {
		expect(buildTemplateScript(`Order ${ID} is ${STATE}`)).toBe('RESULT_VAR = "Order " + VAR_0 + " is " + VAR_1');
		expect(buildTemplateScript(` ${ID} `)).toBe('RESULT_VAR = VAR_0');
		expect(buildTemplateScript(`${ID}/${ID}`)).toBe('RESULT_VAR = VAR_0 + "/" + VAR_0');
	});

	it('takes each distinct step reference and global as an input, unwrapped', () => {
		expect(getTransformationArgs(`${ID} {{global.region}} ${ID}`))
			.toEqual([`${COLOR}.(response).body.$.id`, '{{global.region}}']);
	});

	it('needs a step reference and refuses webhook parameters', () => {
		expect(getTransformationAvailability(`Order ${ID}`)).toBe('ok');
		expect(getTransformationAvailability('plain text')).toBe('noStepReference');
		expect(getTransformationAvailability('{{global.region}}')).toBe('noStepReference');
		expect(getTransformationAvailability(`${ID} \${orderId}`)).toBe('webhookParameter');
	});

	it('keeps only the inputs once the value is transformed', () => {
		expect(toTransformedValue(`Order ${ID} is ${STATE}`)).toBe(`${ID} ${STATE}`);
	});
});

describe('notification transformation targets', () => {
	it('fills only values the tool copies whole into the body', () => {
		const fact = { ...createFact(), label: 'Status', value: STATE };
		const slack = { text: ID, header: 'New order', body: STATE, facts: [fact], buttonUrl: ID };
		expect(locateTransformTarget('slack', slack, { kind: 'field', key: 'text' })).toEqual({ kind: 'whole', path: ['text'] });
		expect(locateTransformTarget('slack', slack, { kind: 'field', key: 'body' }))
			.toEqual({ kind: 'whole', path: ['blocks', '1', 'text', 'text'] });
		// Slack joins label and value into one mrkdwn string.
		expect(locateTransformTarget('slack', slack, { kind: 'fact', key: 'facts', factId: fact.id })).toEqual({ kind: 'combined' });
		// The button exists only with a button text.
		expect(locateTransformTarget('slack', slack, { kind: 'field', key: 'buttonUrl' })).toEqual({ kind: 'unused' });

		const teams = { title: 'Order', facts: [fact], mention: ID };
		expect(locateTransformTarget('teams', teams, { kind: 'fact', key: 'facts', factId: fact.id })).toEqual({ kind: 'whole',
			path: ['attachments', '0', 'content', 'body', '1', 'facts', '0', 'value'] });
		expect(locateTransformTarget('teams', teams, { kind: 'field', key: 'mention' })).toEqual({ kind: 'combined' });
	});
});

describe('notification transformation bindings', () => {
	const other: FieldBinding = { enhancement: createTransformationEnhancement('#ffaa00.(request).body.$.name', ID) };
	const transformedBody = (config: NotificationConfig) => {
		const enhancement = createTransformationEnhancement(buildTransformationResultVar(COLOR, ['blocks', '0', 'text', 'text']), STATE);
		const bindings: FieldBinding[] = [{ enhancement: { ...enhancement, script: 'RESULT_VAR = VAR_0.toUpperCase()' } }, other];
		return { bindings, transformations: { [transformTargetId('slack', { kind: 'field', key: 'body' })]: enhancement.enhanceId }, config };
	};

	it('follows its field when the body block moves, keeps its script and leaves other steps alone', () => {
		const { bindings, transformations } = transformedBody(configFor('slack', { text: 'Hi', body: STATE }));
		const moved = configFor('slack', { text: 'Hi', header: 'New', body: `${STATE} ${ID}` });
		const next = reconcileTransformationBindings({ config: moved, color: COLOR, bindings, transformations });
		expect(resultVarOf(next)).toBe(`${COLOR}.(request).body.$.blocks.[1].text.text`);
		expect(next[0].enhancement.args).toMatchObject({ VAR_0: `${COLOR}.(response).body.$.state`, VAR_1: `${COLOR}.(response).body.$.id` });
		expect(next[0].enhancement.script).toBe('RESULT_VAR = VAR_0.toUpperCase()');
		expect(next[1]).toBe(other);
	});

	it('is read back from the saved config by its result path', () => {
		const { bindings, transformations, config } = transformedBody(configFor('slack', { text: 'Hi', body: STATE }));
		expect(matchTransformations(config, COLOR.toUpperCase(), bindings)).toEqual(transformations);
	});

	it('goes with its field, its last step reference, or an untransformed field', () => {
		const { bindings, transformations } = transformedBody(configFor('slack', { text: 'Hi', body: STATE }));
		const withoutReference = configFor('slack', { text: 'Hi', body: '{{global.region}}' });
		expect(reconcileTransformationBindings({ config: withoutReference, color: COLOR, bindings, transformations })).toEqual([other]);
		expect(reconcileTransformationBindings({ config: configFor('slack', { text: 'Hi', body: STATE }), color: COLOR,
			bindings, transformations: {} })).toEqual([other]);
	});

	it('stays in hand-edited JSON while its value still holds a step reference', () => {
		const { bindings, transformations } = transformedBody(configFor('slack', { text: 'Hi', body: STATE }));
		const json = (body: string) => updateActiveDraft(configFor('slack', {}), (draft) => ({ ...draft,
			jsonOverride: JSON.stringify({ text: 'Hi', blocks: [{ type: 'section', text: { type: 'mrkdwn', text: body } }] }) }));
		expect(reconcileTransformationBindings({ config: json(STATE), color: COLOR, bindings, transformations })).toEqual(bindings);
		expect(reconcileTransformationBindings({ config: json('static'), color: COLOR, bindings, transformations })).toEqual([other]);
	});

	it('is saved as a backend field binding on the body field', () => {
		const { bindings } = transformedBody(configFor('slack', {}));
		const [saved] = serializeWorkflowFieldBindings(bindings);
		expect(saved.to).toEqual([{ color: COLOR, type: 'request', field: 'body.$.blocks.[0].text.text' }]);
		expect(saved.from).toEqual([{ color: COLOR, type: 'response', field: 'body.$.state' }]);
		expect(saved.enhancement.expertCode).toBe('RESULT_VAR = VAR_0.toUpperCase();');
	});
});
