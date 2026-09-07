import { describe, expect, it } from 'vitest';
import { normalizeWorkflowFieldBindings } from './connectionPayload.fieldBindings';

type NormalizedEnhancement = {
	enhanceId: string;
	script: string;
	args: Record<string, string>;
};

const enhancementOf = (bindings: unknown[]) =>
	(bindings[0] as { enhancement: NormalizedEnhancement }).enhancement;

describe('normalizeWorkflowFieldBindings', () => {
	it('builds args and a script from the shape the backend returns', () => {
		const [binding] = normalizeWorkflowFieldBindings([{
			from: [{ color: '#3fa9f5', type: 'response', field: 'body.$.id' }],
			to: [{ color: '#f5a623', type: 'request', field: 'body.$.userId' }],
			enhancement: {
				enhancementId: 42, language: 'js',
				expertCode: 'RESULT_VAR = VAR_0.trim();',
			},
		}]);
		expect(binding.enhancement).toMatchObject({
			enhanceId: '42',
			script: 'RESULT_VAR = VAR_0.trim();',
			args: {
				RESULT_VAR: '#f5a623.(request).body.$.userId',
				VAR_0: '#3fa9f5.(response).body.$.id',
			},
		});
	});

	it('keeps the script of a binding already in the editors\' own shape', () => {
		expect(enhancementOf(normalizeWorkflowFieldBindings([{
			enhancement: {
				enhanceId: 'en-1', language: 'js', script: 'RESULT_VAR = VAR_0 + VAR_1',
				args: { RESULT_VAR: 'a', VAR_0: 'b', VAR_1: 'c' },
			},
		}])).script).toBe('RESULT_VAR = VAR_0 + VAR_1');
	});

	it('recovers the script of one that has args but keeps its code as expertCode', () => {
		// The case that opened blank in the field-binding drawer: enhanceId and args
		// present, so the early path was taken, but every editor reads `script`.
		const enhancement = enhancementOf(normalizeWorkflowFieldBindings([{
			enhancement: {
				enhanceId: 'en-2', language: 'js',
				expertCode: 'RESULT_VAR = VAR_0.toUpperCase();',
				args: { RESULT_VAR: 'a', VAR_0: 'b' },
			},
		}]));
		expect(enhancement.script).toBe('RESULT_VAR = VAR_0.toUpperCase();');
		expect(enhancement.args).toEqual({ RESULT_VAR: 'a', VAR_0: 'b' });
	});

	it('falls back to the default script when there is no code at all', () => {
		expect(enhancementOf(normalizeWorkflowFieldBindings([{
			enhancement: { enhanceId: 'en-3', language: 'js', args: { RESULT_VAR: 'a' } },
		}])).script).toBe('RESULT_VAR = VAR_0;');
	});

	it('leaves a binding without an enhancement alone', () => {
		expect(normalizeWorkflowFieldBindings([{ id: 7 }])).toEqual([{ id: 7 }]);
		expect(normalizeWorkflowFieldBindings(undefined)).toEqual([]);
	});
});
