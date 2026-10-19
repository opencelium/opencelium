import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { NashornServer } from './nashornServer.testSupport';
import { nashornParityCases } from './nashornParity.cases';
import { execute } from './sandbox.worker.testSupport';
const backend = new NashornServer();
const rejected = new Set([
	'arrow',
	'let',
	'const-confirm',
	'template',
	'class',
	'find',
	'assign',
	'includes',
]);
beforeAll(() => backend.start(), 20000);
afterAll(() => backend.stop(), 20000);
describe('sandbox compared with a running Nashorn backend', () => {
	it.each(nashornParityCases)(
		'$id',
		async (c) => {
			const server = await backend.execute(c);
			const browser = execute(c);
			if (rejected.has(c.id)) {
				expect(server.kind).toBe('error');
				expect(browser?.kind).toBe('error');
				if (c.id === 'const-confirm')
					expect(server).toHaveProperty('message', expect.stringMatching(/const/));
			} else if (c.id === 'long-typeof') {
				// A top-level Java Long is an object in Nashorn and a number in the browser.
				expect(server).toMatchObject({ kind: 'value', value: 'object' });
				expect(browser).toMatchObject({ kind: 'value', value: 'number' });
			} else {
				expect(server.kind).toBe('value');
				expect(browser).toMatchObject({
					kind: 'value',
					value: 'value' in server ? server.value : undefined,
				});
			}
		},
		20000,
	);
});
