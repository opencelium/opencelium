import { parse, type Node } from 'acorn';
import { full } from 'acorn-walk';
import type { CompatibilityIssue } from './sandbox.types';

export const unsupportedMethods = [
	'find',
	'findIndex',
	'includes',
	'startsWith',
	'endsWith',
	'repeat',
	'padStart',
	'padEnd',
	'flat',
	'flatMap',
	'at',
	'replaceAll',
];
export const unsupportedGlobals = [
	'Promise',
	'Symbol',
	'Map',
	'Set',
	'WeakMap',
	'WeakSet',
	'fetch',
	'Proxy',
	'Reflect',
	'BigInt',
];
export const unsupportedStatics: Record<string, string[]> = {
	Object: [
		'assign',
		'entries',
		'values',
		'fromEntries',
		'getOwnPropertySymbols',
		'is',
		'setPrototypeOf',
	],
	Array: ['from', 'of'],
	Number: ['isNaN', 'isFinite', 'isInteger', 'isSafeInteger'],
	String: ['raw', 'fromCodePoint'],
	Math: ['trunc', 'sign', 'cbrt', 'hypot', 'imul', 'fround', 'clz32'],
};
type InspectNode = Node & {
	name?: string;
	computed?: boolean;
	object?: InspectNode;
	property?: InspectNode;
	callee?: InspectNode;
	value?: unknown;
};

const serverOnlyGlobals = ['load', 'Packages', 'java', 'quit', 'exit'];

/**
 * Lint for things that compile on Nashorn but fail there or in a test run.
 * Syntax is checked by the backend (/lang-code/validate), so code that does not
 * parse simply yields no lint warnings.
 */
export function checkNashornCompatibility(script: string): CompatibilityIssue[] {
	const issues: CompatibilityIssue[] = [];
	const add = (node: Node, kind: 'unsupportedBuiltin' | 'serverOnly', name: string) => {
		issues.push({
			kind,
			name,
			line: node.loc?.start.line ?? 1,
			column: node.loc?.start.column ?? 0,
		});
	};
	let tree: Node;
	try {
		tree = parse(script, { ecmaVersion: 'latest', locations: true });
	} catch {
		return issues;
	}
	full(tree, (raw) => {
		const node = raw as InspectNode;
		if (node.type === 'MemberExpression') {
			const owner = node.object?.name;
			const member = node.computed ? node.property?.value : node.property?.name;
			if (owner === 'Java')
				add(node, 'serverOnly', typeof member === 'string' ? `Java.${member}` : 'Java');
			else if (
				typeof member === 'string' &&
				(unsupportedMethods.includes(member) ||
					(owner && unsupportedStatics[owner]?.includes(member)))
			) {
				add(node, 'unsupportedBuiltin', owner ? `${owner}.${member}` : member);
			}
		}
		if (node.type === 'Identifier' && node.name && unsupportedGlobals.includes(node.name)) {
			add(node, 'unsupportedBuiltin', node.name);
		}
		if (node.type === 'Identifier' && node.name === 'console') {
			issues.push({ kind: 'console', line: node.loc?.start.line ?? 1, column: node.loc?.start.column ?? 0 });
		}
		if (node.type === 'Identifier' && node.name && serverOnlyGlobals.includes(node.name)) {
			add(node, 'serverOnly', node.name);
		}
	});
	return issues;
}
