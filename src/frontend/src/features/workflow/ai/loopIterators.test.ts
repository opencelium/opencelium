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

	/** The picker can only author an array as `[0]`, `[*]` or `[<iterator>]`. */
	it.each([
		['the whole array', '$.users[*]'],
		['the first element', '$.users[0]'],
		['a bare collection', '$.users'],
	])('reads the collection through %s', (_label, authored) => {
		const accessors = buildIteratorAccessors(
			connectionWith([loop('1', 'i', `{%#AABBCC.(response).body.${authored}%}`)]),
			methodAt('1_0'),
		);

		expect(accessors.get(iteratorKey('#aabbcc', '$.users'))).toBe('i');
	});

	it.each(['$', '$[*]', '$[0]', '$.[0]'])(
		'reads a root-array collection authored as %s', (authored) => {
			const accessors = buildIteratorAccessors(
				connectionWith([loop('1', 'i', `{%#AABBCC.(response).body.${authored}%}`)]),
				methodAt('1_0'),
			);

			expect(accessors.get(iteratorKey('#aabbcc', '$'))).toBe('i');
		});

	/**
	 * A trailing iterator subscript names one element of the *enclosing* loop's collection.
	 * Stripping it would key the outer collection to the inner iterator.
	 */
	it('keeps an inner collection distinct from the outer one it hangs off', () => {
		const accessors = buildIteratorAccessors(
			connectionWith([
				loop('1', 'i', '{%#AABBCC.(response).body.$.users[*]%}'),
				loop('1_2', 'j', '{%#AABBCC.(response).body.$.users[i].tags[*]%}'),
			]),
			methodAt('1_2_0'),
		);

		expect(accessors.get(iteratorKey('#aabbcc', '$.users'))).toBe('i');
		expect(accessors.get(iteratorKey('#aabbcc', '$.users[i].tags'))).toBe('j');
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
