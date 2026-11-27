import { describe, expect, it } from 'vitest';
import { JSONPathEnvironment } from 'json-p3';
import { findBrokenReferences } from './brokenReferences';

const STEPS = new Set(['#c77e7e', '#98bec7']);
const environment = new JSONPathEnvironment();
// Only what is wrong; where it stands has a test of its own.
const check = (text: string) => findBrokenReferences(text, STEPS, environment)
	.map((broken) => Object.fromEntries(Object.entries(broken).filter(([key]) => !['token', 'start', 'end'].includes(key))));

describe('findBrokenReferences', () => {
	it('accepts references the backend resolves, whatever the color case', () => {
		expect(check([
			'{%#C77E7E.(response).body.$.length()%}',
			'{% #98bec7.(request).body.$.items[0].name %}',
			'{%#C77E7E.(response).body.$.[0].id%}',
			'{%#C77E7E.(response).header.X-Total%}',
			'{%#C77E7E.(response).status%}',
			'${order:id} {{global.region}} 100%',
		].join(' '))).toEqual([]);
	});

	it('names a mistyped request or response', () => {
		expect(check('{%#C77E7E.(respnse).body.$.length()%}')).toEqual([{ reason: 'direction', direction: 'respnse' }]);
	});

	it('flags a token that is not shaped like a step reference', () => {
		expect(check('{%C77E7E.(response).body.$.x%} {%#C77E7.(response).body.$.x%} {%#C77E7E.(response).bdy.$.x%}'))
			.toEqual([{ reason: 'malformed' }, { reason: 'malformed' }, { reason: 'malformed' }]);
	});

	it('flags a step this workflow does not have', () => {
		expect(check('{%#123456.(response).body.$.id%}')).toEqual([{ reason: 'unknownStep', color: '#123456' }]);
	});

	it('flags a JSON path that does not compile, once the path checker is loaded', () => {
		const token = '{%#C77E7E.(response).body.$.items[0.name%}';
		expect(check(token)).toEqual([{ reason: 'pathSyntax', character: expect.anything() }]);
		expect(findBrokenReferences(token, STEPS, null)).toEqual([]);
	});

	it('says where each broken token stands in the text', () => {
		const text = '{"a": "ok {%#C77E7E.(response).body.$.id%}", "b": "x {%#C77E7E.(respnse).body.$.id%}"}';
		const [broken] = findBrokenReferences(text, STEPS, environment);
		expect(text.slice(broken.start, broken.end)).toBe('{%#C77E7E.(respnse).body.$.id%}');
	});
});
