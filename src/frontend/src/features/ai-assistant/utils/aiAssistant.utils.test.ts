import { describe, expect, it } from 'vitest';
import type { Connector } from '@entities/connector/model/types';
import type { WorkflowNodeModel } from '@features/workflow/types/workflow.types';
import type { WorkflowDsl } from '../model/workflowDsl.schema';
import { pickDefaultConnectors, toConnectorChoices } from './aiConnectors.utils';
import { buildDslPreview, issuesForAssignment } from './dslPreview.utils';
import { toAiGenerationError } from './aiGenerationError.utils';

const dsl: WorkflowDsl = {
	steps: [
		{ id: 's1', kind: 'method', connector: 'from', operation: 'GetIssues', params: [], fields: [] },
		{
			id: 's2', kind: 'loop', over: { step: 's1', path: 'issues' },
			body: [
				{
					id: 's3', kind: 'if',
					condition: { left: { ref: { step: 's2', path: 'fields.priority.name' } }, op: 'eq', right: { literal: 'High' } },
					then: [
						{
							id: 's4', kind: 'method', connector: 'to', operation: 'TicketCreate', params: [],
							fields: [{ name: 'title', value: { ref: { step: 's2', path: 'fields.summary' } } }],
						},
						{
							id: 's5', kind: 'loop', over: { step: 's2', path: 'fields.labels' },
							body: [],
						},
					],
				},
			],
		},
	],
};

describe('buildDslPreview', () => {
	const preview = buildDslPreview(dsl);

	it('counts every step, nested ones included', () => {
		expect(preview.stepCount).toBe(5);
	});

	it('reads a method ref as operation and path', () => {
		expect(preview.describeValue({ ref: { step: 's4', path: 'id' } })).toEqual({ kind: 'ref', source: 'TicketCreate', path: 'id' });
	});

	it('reads a loop element ref through the array it iterates', () => {
		expect(preview.describeValue({ ref: { step: 's2', path: 'fields.summary' } }))
			.toEqual({ kind: 'ref', source: 'GetIssues', path: 'issues[].fields.summary' });
	});

	it('describes nested loop sources through the outer loop', () => {
		const inner = dsl.steps[1]?.kind === 'loop' && dsl.steps[1].body[0]?.kind === 'if' ? dsl.steps[1].body[0].then[1] : undefined;
		if (inner?.kind !== 'loop') throw new Error('fixture changed');
		expect(preview.describeLoopSource(inner)).toEqual({ kind: 'ref', source: 'GetIssues', path: 'issues[].fields.labels[]' });
	});

	it('falls back to the raw step id for unknown refs and labels steps by operation or kind', () => {
		expect(preview.describeValue({ ref: { step: 's9', path: 'x' } })).toEqual({ kind: 'ref', source: 's9', path: 'x' });
		expect(preview.stepLabel('s4')).toBe('TicketCreate');
		expect(preview.stepLabel('s2')).toBe('loop');
	});
});

describe('issuesForAssignment', () => {
	it('matches issues by the quoted field or param name', () => {
		const issues = [
			{ stepId: 's5', severity: 'warning' as const, message: 'Field "ticket_id" path "id" is not declared in the response' },
			{ stepId: 's5', severity: 'warning' as const, message: 'Field "ticket" is odd' },
		];
		expect(issuesForAssignment(issues, 's5', 'ticket_id')).toHaveLength(1);
		expect(issuesForAssignment(issues, 's4', 'ticket_id')).toHaveLength(0);
	});
});

describe('connector defaults', () => {
	const connectors = [
		{ connectorId: 1, title: 'Jira', icon: null, invoker: { name: 'Jira' } },
		{ connectorId: 2, title: 'Zammad', icon: null, invoker: { name: 'zammad' } },
		{ connectorId: 3, title: 'Broken', icon: null, invoker: { name: '' } },
	] as unknown as Connector[];
	const node = (connectorId?: number) => ({ data: { connector: connectorId === undefined ? undefined : { connectorId } } }) as WorkflowNodeModel;

	it('keeps only connectors with an invoker', () => {
		expect(toConnectorChoices(connectors).map((choice) => choice.invokerName)).toEqual(['Jira', 'zammad']);
	});

	it('prefills from the first two distinct connectors on the canvas', () => {
		const choices = toConnectorChoices(connectors);
		expect(pickDefaultConnectors([node(), node(2), node(2), node(1)], choices)).toEqual({ fromId: 2, toId: 1 });
		expect(pickDefaultConnectors([node(1)], choices)).toEqual({ fromId: 1, toId: null });
	});
});

describe('toAiGenerationError', () => {
	it.each([
		[{ name: 'AbortError', message: 'Aborted' }, { failure: 'aborted' }],
		[{ status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' }, { failure: 'unreachable' }],
		[{ status: 404, data: { error: { type: 'UNKNOWN_INVOKER', message: 'Unknown invoker "x"' } } },
			{ failure: 'unknown-invoker', message: 'Unknown invoker "x"' }],
		[{ status: 502, data: { error: { type: 'GENERATION_FAILED', message: 'fetch failed' } } },
			{ failure: 'generation-failed', message: 'fetch failed' }],
		[{ status: 500, data: 'oops' }, { failure: 'generation-failed' }],
	])('%j', (error, expected) => {
		expect(toAiGenerationError(error)).toEqual(expected);
	});
});
