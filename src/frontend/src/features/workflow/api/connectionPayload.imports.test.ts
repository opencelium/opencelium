import { describe, expect, it } from 'vitest';
import { normalizeWorkflowFieldBindings, serializeWorkflowFieldBindings } from './connectionPayload.fieldBindings';

describe('enhancement imports in the save payload', () => {
	const editorBinding = {
		enhancement: {
			enhanceId: '7', language: 'js', script: 'RESULT_VAR = globals.normalizeDate(VAR_0);',
			imports: ['normalizeDate', 'defaultTz'],
			args: { RESULT_VAR: '#f5a623.(request).body.$.when', VAR_0: '#3fa9f5.(response).body.$.created' },
		},
	};

	it('sends the imports and no global script', () => {
		const [saved] = serializeWorkflowFieldBindings([editorBinding]);
		expect(saved.enhancement).toMatchObject({ imports: ['normalizeDate', 'defaultTz'], globalScript: null });
	});

	it('sends an empty list when nothing is imported', () => {
		const [saved] = serializeWorkflowFieldBindings([{ ...editorBinding, enhancement: { ...editorBinding.enhancement, imports: undefined } }]);
		expect(saved.enhancement.imports).toEqual([]);
	});

	it('keeps the imports the backend returns', () => {
		const [loaded] = normalizeWorkflowFieldBindings([{
			from: [{ color: '#3fa9f5', type: 'response', field: 'body.$.created' }],
			to: [{ color: '#f5a623', type: 'request', field: 'body.$.when' }],
			enhancement: { enhancementId: 7, language: 'js', expertCode: 'x', imports: ['normalizeDate'], globalScript: null },
		}]);
		expect(loaded.enhancement.imports).toEqual(['normalizeDate']);
	});
});
