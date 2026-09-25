import { describe, expect, it } from 'vitest';
import { findJsonPathPositions, findJsonSyntaxErrorPosition } from './workflowJson.locations';

describe('workflow JSON text locations', () => {
	it('finds a nested property inside an array', () => {
		const json = JSON.stringify({ fromConnector: { methods: [{ connector: { invoker: 'bad' } }] } }, null, 2);
		expect(findJsonPathPositions(json).get('fromConnector.methods.0.connector.invoker'))
			.toEqual({ row: 5, column: 10 });
	});

	it('finds syntax error offset', () => {
		expect(findJsonSyntaxErrorPosition('{\n  "name": }', 'Unexpected token at position 12'))
			.toEqual({ row: 1, column: 10 });
	});

	it('finds syntax errors when the browser message has no position', () => {
		const json = '{\n  "body": {\n    "fields": {\n      "sds": "" "\n    }\n  }\n}';
		expect(findJsonSyntaxErrorPosition(json,
			'Unexpected token \'"\', ... is not valid JSON'))
			.toEqual({ row: 3, column: 16 });
	});
});
