import { parse, type Node } from 'acorn';
import { full } from 'acorn-walk';
import { hasNashornSyntax } from './hasNashornSyntax';

export type IssueKind = 'syntax' | 'unsupportedBuiltin' | 'serverOnly' | 'timezone';
export type CompatibilityIssue = {
	kind: IssueKind;
	message: string;
	line: number;
	column: number;
};
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
	'console',
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
	kind?: string;
	regex?: { flags: string };
};

export function checkNashornCompatibility(script: string): CompatibilityIssue[] {
	const issues: CompatibilityIssue[] = [];
	const add = (node: Node, kind: IssueKind, message: string) => {
		issues.push({
			kind,
			message,
			line: node.loc?.start.line ?? 1,
			column: node.loc?.start.column ?? 0,
		});
	};
	let tree: Node;
	try {
		tree = parse(script, { ecmaVersion: 5, locations: true });
	} catch (error) {
		const failure = error as SyntaxError & {
			loc?: { line: number; column: number };
			pos?: number;
		};
		const serverSyntax = hasNashornSyntax(script, failure.pos ?? 0);
		issues.push({
			kind: serverSyntax ? 'serverOnly' : 'syntax',
			message: serverSyntax ? 'nashornSyntax' : 'syntax',
			line: failure.loc?.line ?? 1,
			column: failure.loc?.column ?? 0,
		});
		try {
			tree = parse(script, { ecmaVersion: 'latest', locations: true });
			issues[0].kind = 'syntax';
			issues[0].message = 'syntax';
			{
				full(tree, (raw) => {
					const node = raw as InspectNode;
					const syntaxMessage =
						node.type === 'ArrowFunctionExpression'
							? 'arrowSyntax'
							: node.type === 'TemplateLiteral'
								? 'templateSyntax'
								: node.type === 'VariableDeclaration' && node.kind !== 'var'
									? 'declarationSyntax'
									: node.type === 'ClassDeclaration' || node.type === 'ClassExpression'
										? 'classSyntax'
										: node.type === 'SpreadElement' || node.type === 'RestElement'
											? 'spreadSyntax'
											: node.type === 'ObjectPattern' || node.type === 'ArrayPattern'
												? 'destructuringSyntax'
												: node.regex && /[uys]/.test(node.regex.flags)
													? 'regexSyntax'
													: undefined;
					if (
						syntaxMessage &&
						issues[0].message === 'syntax' &&
						node.start <= (failure.pos ?? 0) &&
						node.end >= (failure.pos ?? 0)
					)
						issues[0].message = syntaxMessage;
				});
			}
		} catch {
			return issues;
		}
	}
	full(tree, (raw) => {
		const node = raw as InspectNode;
		if (node.type === 'MemberExpression') {
			const owner = node.object?.name;
			const member = node.computed ? node.property?.value : node.property?.name;
			if (owner === 'Java')
				add(node, 'serverOnly', typeof member === 'string' ? `Java.${member}` : 'Java');
			else if (owner === 'Date') add(node, 'timezone', 'Date');
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
		if (node.type === 'CallExpression' && node.callee?.name === 'load')
			add(node, 'serverOnly', 'load');
		if (
			(node.type === 'NewExpression' || node.type === 'CallExpression') &&
			node.callee?.name === 'Date'
		) {
			add(node, 'timezone', 'Date');
		}
	});
	return issues;
}
