import { describe, expect, it } from 'vitest';
import type { WorkflowMethodConfig } from '../types/request-config.types';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { describeEnhancementChange, describeMethodConfigChange,
	findChangedEnhancementTarget } from './workflowUndoMethodChange.utils';
import { undoChangeLabel } from './workflowUndoLabel.utils';

const config = (overrides: Partial<WorkflowMethodConfig> = {}): WorkflowMethodConfig => ({
	name: 'getAllUser', url: '/user', method: 'GET', headers: {}, queryParams: [],
	endpointArgs: {}, bodyFormat: 'json', bodyData: 'raw', body: {}, ...overrides,
});

const REF_A = '{%#C77E7E.(response).body.$.id%}';
const REF_B = '{%#6477AB.(response).body.$.email%}';

const describeOf = (before: Partial<WorkflowMethodConfig>, after: Partial<WorkflowMethodConfig>) =>
	describeMethodConfigChange(config(before), config(after), 'GetAllUser');

describe('describeMethodConfigChange', () => {
	it('attributes an endpoint, verb or query-row edit to the URL', () => {
		expect(describeOf({}, { url: '/user/1' }))
			.toMatchObject({ kind: 'method-url', name: 'GetAllUser' });
		expect(describeOf({}, { method: 'POST' }))
			.toMatchObject({ kind: 'method-url', name: 'GetAllUser' });
		expect(describeOf({}, {
			queryParams: [{ id: 'r1', key: 'page', value: '2', enabled: true }],
		})).toMatchObject({ kind: 'method-url', name: 'GetAllUser' });
	});

	it('attributes a plain header or body edit to its own section', () => {
		expect(describeOf({}, { headers: { 'X-Tenant': 'acme' } }))
			.toMatchObject({ kind: 'method-header', name: 'GetAllUser' });
		expect(describeOf({}, { body: { name: 'literal' } }))
			.toMatchObject({ kind: 'method-body', name: 'GetAllUser' });
		expect(describeOf({}, { bodyFormat: 'xml' }))
			.toMatchObject({ kind: 'method-body', name: 'GetAllUser' });
	});

	it('reports an added, deleted or replaced body reference', () => {
		expect(describeOf({ body: {} }, { body: { id: REF_A } }))
			.toMatchObject({ kind: 'method-reference', section: 'body', operation: 'added', name: 'GetAllUser' });
		expect(describeOf({ body: { id: REF_A } }, { body: {} }))
			.toMatchObject({ kind: 'method-reference', section: 'body', operation: 'removed', name: 'GetAllUser' });
		expect(describeOf({ body: { id: REF_A } }, { body: { id: REF_B } }))
			.toMatchObject({ kind: 'method-reference', section: 'body', operation: 'edited', name: 'GetAllUser' });
	});

	it('reports header references separately from body ones', () => {
		expect(describeOf({ headers: {} }, { headers: { Authorization: REF_A } }))
			.toMatchObject({ kind: 'method-reference', section: 'header', operation: 'added', name: 'GetAllUser' });
	});

	it('finds references nested in arrays and objects', () => {
		expect(describeOf({ body: { users: [{ id: 'plain' }] } },
			{ body: { users: [{ id: REF_A }] } }))
			.toMatchObject({ kind: 'method-reference', section: 'body', operation: 'added', name: 'GetAllUser' });
	});

	it('prefers the reference over the literal text that carries it', () => {
		// The body changed *and* gained a reference; the reference is the story.
		expect(describeOf({ body: { id: 'x' } }, { body: { id: REF_A } }).kind)
			.toBe('method-reference');
	});

	it('labels an enhancement edit that stands alone in its section', () => {
		// A script edit does not touch the body value that holds the reference, so
		// the enhancement is the section's only signal.
		expect(describeMethodConfigChange(
			config({ body: { id: REF_A } }), config({ body: { id: REF_A } }), 'GetAllUser',
			{ section: 'body', aspect: 'script' },
		)).toMatchObject({ kind: 'method-enhancement', section: 'body', aspect: 'script', name: 'GetAllUser' });
	});

	it('names the section when a literal edit and an enhancement edit land together', () => {
		expect(describeMethodConfigChange(
			config({ body: { name: 'x' } }), config({ body: { name: 'y' } }), 'GetAllUser',
			{ section: 'body', aspect: 'script' },
		)).toMatchObject({ kind: 'method-body', name: 'GetAllUser' });
		expect(describeMethodConfigChange(
			config({ headers: { A: 'x' } }), config({ headers: { A: 'y' } }), 'GetAllUser',
			{ section: 'header', aspect: 'language' },
		)).toMatchObject({ kind: 'method-header', name: 'GetAllUser' });
	});

	it('names the section when a reference and an unrelated literal both changed', () => {
		expect(describeMethodConfigChange(
			config({ body: { id: 'plain', other: 'a' } }),
			config({ body: { id: REF_A, other: 'b' } }),
			'GetAllUser',
		)).toMatchObject({ kind: 'method-body', name: 'GetAllUser' });
	});

	it('keeps a pure reference add specific, even though it creates a binding', () => {
		// updateRequestFieldBindings always mints a binding for a new reference, so
		// counting that as a second change would make this label unreachable.
		expect(describeMethodConfigChange(
			config({ body: {} }), config({ body: { id: REF_A } }), 'GetAllUser',
			{ section: 'body', aspect: 'script' },
		)).toMatchObject({ kind: 'method-reference', section: 'body', operation: 'added', name: 'GetAllUser' });
	});

	it('ignores an enhancement belonging to a different section than the edit', () => {
		expect(describeMethodConfigChange(config({}), config({ url: '/other' }), 'GetAllUser', null))
			.toMatchObject({ kind: 'method-url', name: 'GetAllUser' });
	});

	it('falls back to "multiple" when two sections changed in one entry', () => {
		expect(describeOf({}, { url: '/other', headers: { A: 'b' } }))
			.toMatchObject({ kind: 'multiple' });
	});
});

const node = (id: string, color: string, subtitle: string) => ({
	id, type: 'connector', position: { x: 0, y: 0 },
	data: { title: 'Method', subtitle, kind: 'connector', color },
}) as unknown as WorkflowNodeModel;

const binding = (enhanceId: string, resultVar: string, script: string) =>
	({ enhancement: { enhanceId, language: 'js', script, args: { RESULT_VAR: resultVar, VAR_0: 'x' } } });

describe('findChangedEnhancementTarget', () => {
	it('reads the owning colour and section off RESULT_VAR', () => {
		const before = [binding('e1', '#C77E7E.(request).body.$.name', 'RESULT_VAR = VAR_0')];
		const after = [binding('e1', '#C77E7E.(request).body.$.name', 'RESULT_VAR = VAR_0.trim()')];
		expect(findChangedEnhancementTarget(before, after))
			.toEqual({ color: '#C77E7E', section: 'body', aspect: 'script' });
	});

	it('returns null when the bindings are identical', () => {
		const bindings = [binding('e1', '#C77E7E.(request).body.$.name', 'RESULT_VAR = VAR_0')];
		expect(findChangedEnhancementTarget(bindings, bindings)).toBeNull();
	});
});

describe('describeEnhancementChange', () => {
	const nodes = [node('m1', '#C77E7E', 'GetAllUser'), node('m2', '#6477AB', 'AddUser')];

	it('names the owning method and section from the enhancement result var', () => {
		const before = [binding('e1', '#C77E7E.(request).body.$.name', 'RESULT_VAR = VAR_0')];
		const after = [binding('e1', '#C77E7E.(request).body.$.name', 'RESULT_VAR = VAR_0.trim()')];
		expect(describeEnhancementChange(before, after, nodes))
			.toMatchObject({ kind: 'method-enhancement', section: 'body', aspect: 'script', name: 'GetAllUser' });
	});

	it('resolves a header enhancement on a different method', () => {
		const after = [binding('e2', '#6477AB.(request).header.$.Authorization', 'RESULT_VAR = VAR_0')];
		expect(describeEnhancementChange([], after, nodes))
			.toMatchObject({ kind: 'method-enhancement', section: 'header', aspect: 'script', name: 'AddUser' });
	});

	it('tells a language, description, deletion and script change apart', () => {
		const at = (overrides: Record<string, unknown>) => [{ enhancement: {
			enhanceId: 'e1', language: 'js', description: '', script: 'RESULT_VAR = VAR_0',
			args: { RESULT_VAR: '#C77E7E.(request).body.$.name', VAR_0: 'x' }, ...overrides } }];

		expect(describeEnhancementChange(at({}), at({ language: 'python3' }), nodes))
			.toMatchObject({ kind: 'method-enhancement', section: 'body', aspect: 'language', name: 'GetAllUser' });
		expect(describeEnhancementChange(at({}), at({ description: 'trims it' }), nodes))
			.toMatchObject({ kind: 'method-enhancement', section: 'body', aspect: 'description', name: 'GetAllUser' });
		expect(describeEnhancementChange(at({}), [], nodes))
			.toMatchObject({ kind: 'method-enhancement', section: 'body', aspect: 'removed', name: 'GetAllUser' });
		expect(describeEnhancementChange(at({}), at({ script: 'RESULT_VAR = VAR_0.trim()' }), nodes))
			.toMatchObject({ kind: 'method-enhancement', section: 'body', aspect: 'script', name: 'GetAllUser' });
	});

	it('reports one multi-aspect session generically rather than naming one part', () => {
		// One Body dialog visit that changed the language, the script and the
		// description is one entry — it must not read as only a language change.
		const before = [{ enhancement: { enhanceId: 'e1', language: 'js', description: 'old',
			script: 'RESULT_VAR = VAR_0',
			args: { RESULT_VAR: '#C77E7E.(request).body.$.name', VAR_0: 'x' } } }];
		const after = [{ enhancement: { enhanceId: 'e1', language: 'python3', description: 'new',
			script: 'RESULT_VAR = VAR_0.strip()',
			args: { RESULT_VAR: '#C77E7E.(request).body.$.name', VAR_0: 'x' } } }];

		expect(describeEnhancementChange(before, after, nodes))
			.toMatchObject({ kind: 'method-enhancement', section: 'body', aspect: 'multiple', name: 'GetAllUser' });
	});

	it('reports a reference-argument change as a script change', () => {
		const at = (varZero: string) => [{ enhancement: { enhanceId: 'e1', language: 'js',
			description: '', script: 'RESULT_VAR = VAR_0',
			args: { RESULT_VAR: '#C77E7E.(request).body.$.name', VAR_0: varZero } } }];
		expect(describeEnhancementChange(at('a'), at('b'), nodes))
			.toMatchObject({ kind: 'method-enhancement', section: 'body', aspect: 'script', name: 'GetAllUser' });
	});

	it('treats a missing and an empty description as the same', () => {
		const withKey = [{ enhancement: { enhanceId: 'e1', language: 'js', description: '',
			script: 's', args: { RESULT_VAR: '#C77E7E.(request).body.$.name' } } }];
		const withoutKey = [{ enhancement: { enhanceId: 'e1', language: 'js',
			script: 's2', args: { RESULT_VAR: '#C77E7E.(request).body.$.name' } } }];
		expect(describeEnhancementChange(withKey, withoutKey, nodes))
			.toMatchObject({ kind: 'method-enhancement', section: 'body', aspect: 'script', name: 'GetAllUser' });
	});

	it('falls back to the generic reference label when nothing is attributable', () => {
		expect(describeEnhancementChange([], [{ enhancement: { enhanceId: 'e3', args: {} } }], nodes))
			.toMatchObject({ kind: 'references' });
	});
});

describe('undoChangeLabel for the method kinds', () => {
	it('maps each kind, exposing the section as a key the caller resolves', () => {
		expect(undoChangeLabel({ kind: 'method-url', name: 'X' }).key)
			.toBe('undoHistory.change.methodUrl');
		expect(undoChangeLabel({ kind: 'method-header', name: 'X' }).key)
			.toBe('undoHistory.change.methodHeader');
		expect(undoChangeLabel({ kind: 'method-body', name: 'X' }).key)
			.toBe('undoHistory.change.methodBody');
		expect(undoChangeLabel({
			kind: 'method-reference', section: 'header', operation: 'removed', name: 'X',
		})).toEqual({
			key: 'undoHistory.change.referenceRemoved',
			values: { name: 'X' },
			valueKeys: { section: 'undoHistory.section.header' },
		});
		expect(undoChangeLabel({ kind: 'method-enhancement', section: 'body', name: 'X' }))
			.toEqual({
				key: 'undoHistory.change.enhancement',
				values: { name: 'X' },
				valueKeys: { section: 'undoHistory.section.body' },
			});
	});
});
