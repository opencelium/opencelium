import { describe, expect, it } from 'vitest';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { NOT_EXIST_ARG } from './enhancementArgs';
import { findBrokenEnhancementScripts } from './graph.brokenScriptValidation';

const method = (id: string, name: string, color: string) => ({
	id, type: 'connector', position: { x: 0, y: 0 },
	data: { title: 'Method', subtitle: name, kind: 'connector', color },
}) as unknown as WorkflowNodeModel;

const nodes = [
	method('m1', 'GetUsers', '#3fa9f5'),
	method('m2', 'CreateTicket', '#f5a623'),
];

const binding = (enhanceId: string, script: string, resultVar: string) =>
	({ enhancement: { enhanceId, language: 'js', script, args: { RESULT_VAR: resultVar } } });

const TARGET = '#f5a623.(request).body.$.total';

describe('findBrokenEnhancementScripts', () => {
	it('finds the marker and names the method whose field the script fills', () => {
		expect(findBrokenEnhancementScripts(nodes, [
			binding('en-1', `RESULT_VAR = VAR_0 + ${NOT_EXIST_ARG}`, TARGET),
		])).toEqual([{ enhanceId: 'en-1', nodeId: 'm2', label: 'CreateTicket' }]);
	});

	it('passes a workflow whose scripts are all intact', () => {
		expect(findBrokenEnhancementScripts(nodes, [
			binding('en-1', 'RESULT_VAR = VAR_0 + VAR_1', TARGET),
			binding('en-2', 'RESULT_VAR = VAR_0', TARGET),
		])).toEqual([]);
		expect(findBrokenEnhancementScripts(nodes, [])).toEqual([]);
		expect(findBrokenEnhancementScripts(nodes, undefined)).toEqual([]);
	});

	it('reports every offender, not just the first', () => {
		const broken = findBrokenEnhancementScripts(nodes, [
			binding('en-1', `RESULT_VAR = ${NOT_EXIST_ARG}`, TARGET),
			binding('en-2', 'RESULT_VAR = VAR_0', TARGET),
			binding('en-3', `RESULT_VAR = VAR_0 || ${NOT_EXIST_ARG}`,
				'#3fa9f5.(request).body.$.name'),
		]);
		expect(broken.map((item) => item.enhanceId)).toEqual(['en-1', 'en-3']);
		expect(broken.map((item) => item.nodeId)).toEqual(['m2', 'm1']);
	});

	it('still reports one whose own method is gone, with nothing to flag', () => {
		expect(findBrokenEnhancementScripts(nodes, [
			binding('en-1', `RESULT_VAR = ${NOT_EXIST_ARG}`, '#000001.(request).body.$.x'),
		])).toEqual([{ enhanceId: 'en-1', nodeId: null, label: null }]);
	});

	it('ignores a binding that carries no enhancement at all', () => {
		expect(findBrokenEnhancementScripts(nodes, [{}, { enhancement: null },
			{ enhancement: { script: NOT_EXIST_ARG } }])).toEqual([]);
	});
});
