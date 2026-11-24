import { describe, expect, it } from 'vitest';
import type { MethodWithId } from '../../../types/connection';
import { describeReference } from './referenceDescription';
import { countReferences } from '../../model/notificationBody';

const methods = [{ id: 'm', color: '#C77E7E', label: 'GetAllUser', name: 'GetAllUser' }] as unknown as MethodWithId[];
const labels = { webhook: 'Webhook', global: 'Global' };

describe('describeReference', () => {
	it('names a step reference after its method and shortens the path', () => {
		expect(describeReference('{%#c77e7e.(response).body.$.[0].name%}', methods, labels))
			.toMatchObject({ kind: 'step', source: 'GetAllUser', path: '[0].name', color: '#c77e7e' });
	});

	it('reads webhook parameters and global variables', () => {
		expect(describeReference('${orderId:int}', methods, labels)).toMatchObject({ kind: 'webhook', source: 'Webhook', path: 'orderId' });
		expect(describeReference('{{global.apiKey}}', methods, labels)).toMatchObject({ kind: 'global', source: 'Global', path: 'apiKey' });
	});
});

describe('countReferences', () => {
	it('counts all three kinds of token', () => {
		expect(countReferences('{"a":"{%#C77E7E.(response).status%} ${id} {{global.x}} plain {curly}"}')).toBe(3);
	});
});
