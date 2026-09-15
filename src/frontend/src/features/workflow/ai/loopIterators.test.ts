import { describe, expect, it } from 'vitest';
import type { Connection, MethodWithId } from '../types/connection';
import { buildIteratorAccessors, iteratorKey } from './loopIterators';

const loop = (index: string, iterator: string, expression: string) =>
	({ id: `op-${index}`, index, type: 'loop', iterator, expression });

const connectionWith = (operators: unknown[]) => ({
	fromConnector: { operator: operators },
} as unknown as Connection);

const methodAt = (index: string) => ({ index } as MethodWithId);

describe('buildIteratorAccessors', () => {
	it('maps the collection an enclosing loop walks to that loop\'s iterator', () => {
		const accessors = buildIteratorAccessors(
			connectionWith([loop('1', 'i', '{%#AABBCC.(response).body.$.users%} for')]),
			methodAt('1_0'),
		);

		expect(accessors.get(iteratorKey('#aabbcc', '$.users'))).toBe('i');
	});

	it('ignores a loop that does not enclose the method', () => {
		const accessors = buildIteratorAccessors(
			connectionWith([loop('2', 'i', '{%#AABBCC.(response).body.$.users%}')]),
			methodAt('1_0'),
		);

		expect(accessors.size).toBe(0);
	});

	it('carries every loop in the ancestry, innermost included', () => {
		const accessors = buildIteratorAccessors(
			connectionWith([
				loop('1', 'i', '{%#AABBCC.(response).body.$.users%}'),
				loop('1_2', 'j', '{%#AABBCC.(response).body.$.groups%}'),
			]),
			methodAt('1_2_0'),
		);

		expect(accessors.get(iteratorKey('#aabbcc', '$.users'))).toBe('i');
		expect(accessors.get(iteratorKey('#aabbcc', '$.groups'))).toBe('j');
	});

	it('is empty for a method that is in no loop at all', () => {
		const accessors = buildIteratorAccessors(
			connectionWith([loop('1', 'i', '{%#AABBCC.(response).body.$.users%}')]),
			methodAt('0'),
		);

		expect(accessors.size).toBe(0);
	});

	it('ignores an if-operator ancestor, which has no iterator', () => {
		const accessors = buildIteratorAccessors(
			connectionWith([{ id: 'x', index: '1', type: 'if', expression: '{%#AABBCC.(response).body.$.users%}' }]),
			methodAt('1_0'),
		);

		expect(accessors.size).toBe(0);
	});
});
