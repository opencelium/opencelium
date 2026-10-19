import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { NashornServer } from './nashornServer.testSupport';
import { nashornParityCases } from './nashornParity.cases';
import { execute } from './sandbox.worker.testSupport';

// Live check against a running backend; it creates and deletes temporary connections.
// Opt in with OC_TEST_TOKEN, or OC_TEST_EMAIL + OC_TEST_PASSWORD (and OC_TEST_BACKEND_URL
// when the backend is not on 127.0.0.1:9090). Use it to re-record nashornParity.test.ts.
const hasBackend = Boolean(
	process.env.OC_TEST_TOKEN || (process.env.OC_TEST_EMAIL && process.env.OC_TEST_PASSWORD),
);
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
describe.skipIf(!hasBackend)('sandbox compared with a running Nashorn backend', () => {
	const backend = new NashornServer();
	beforeAll(() => backend.start(), 20000);
	afterAll(() => backend.stop(), 20000);
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
