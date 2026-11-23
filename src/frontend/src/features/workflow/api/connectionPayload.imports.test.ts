import { describe, expect, it } from 'vitest';
import { normalizeWorkflowFieldBindings, serializeWorkflowFieldBindings } from './connectionPayload.fieldBindings';

describe('enhancement imports in the save payload', () => {
	const editorBinding = {
		enhancement: {
			enhanceId: '7', language: 'js', script: 'RESULT_VAR = normalizeDate(VAR_0);',
			imports: ['normalizeDate', 'defaultTz'],
			args: { RESULT_VAR: '#f5a623.(request).body.$.when', VAR_0: '#3fa9f5.(response).body.$.created' },
		},
	};

	it('sends each import as an arg holding the whole reference', () => {
		const [saved] = serializeWorkflowFieldBindings([editorBinding]);
		expect(saved.enhancement.expertVar.split('\n')).toEqual([
			'//var RESULT_VAR = #f5a623.(request).body.$.when;',
			'//var VAR_0 = #3fa9f5.(response).body.$.created;',
			'//var normalizeDate = {{global.normalizeDate}};',
			'//var defaultTz = {{global.defaultTz}};',
		]);
		expect(saved.enhancement).not.toHaveProperty('imports');
		expect(saved.enhancement).not.toHaveProperty('globalScript');
	});

	it('adds no arg when nothing is imported', () => {
		const [saved] = serializeWorkflowFieldBindings([{ ...editorBinding, enhancement: { ...editorBinding.enhancement, imports: undefined } }]);
		expect(saved.enhancement.expertVar).not.toContain('{{global.');
	});

	it('reads the imports back from the args the backend returns', () => {
		const [loaded] = normalizeWorkflowFieldBindings([{
			from: [{ color: '#3fa9f5', type: 'response', field: 'body.$.created' }],
			to: [{ color: '#f5a623', type: 'request', field: 'body.$.when' }],
			enhancement: {
				enhancementId: 7, language: 'js', expertCode: 'x',
				expertVar: '//var RESULT_VAR = #f5a623.(request).body.$.when;\n//var VAR_0 = #3fa9f5.(response).body.$.created;\n//var normalizeDate = {{global.normalizeDate}};',
			},
		}]);
		expect(loaded.enhancement.imports).toEqual(['normalizeDate']);
		expect(loaded.enhancement.args).toEqual({ RESULT_VAR: '#f5a623.(request).body.$.when', VAR_0: '#3fa9f5.(response).body.$.created' });
	});
});
