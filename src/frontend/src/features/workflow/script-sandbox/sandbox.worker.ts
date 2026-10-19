import {
	checkNashornCompatibility,
	unsupportedGlobals,
	unsupportedMethods,
	unsupportedStatics,
} from './checkNashornCompatibility';
import { toServerArg, toServerResult } from './simulateBindings';
import type { SandboxRequest, SandboxResult } from './sandbox.types';

const scope = globalThis as unknown as Record<string, unknown>;
const send = (globalThis.postMessage as (result: SandboxResult) => void).bind(globalThis);
const evaluate = eval;

function unavailable(name: string) {
	return function () {
		throw new Error(`${name} is not available on the server engine (Nashorn ES5.1)`);
	};
}
function serverOnly(name: string) {
	return function () {
		throw new Error(`serverOnly:${name}`);
	};
}
function replace(target: object, name: string, value: unknown) {
	Object.defineProperty(target, name, {
		value,
		configurable: false,
		writable: false,
	});
}

globalThis.onmessage = (event: MessageEvent<SandboxRequest>) => {
	const output: string[] = [];
	const log = (...values: unknown[]) => {
		if (output.length >= 1000) return;
		output.push(
			values
				.map((value) => String(value))
				.join(' ')
				.slice(0, 10000),
		);
	};
	try {
		const { script, args } = event.data;
		const syntax = checkNashornCompatibility(script).find(
			(issue) => issue.kind === 'syntax' || issue.message === 'nashornSyntax',
		);
		if (syntax) {
			send({
				kind: 'error',
				message: syntax.kind === 'syntax' ? 'syntax' : 'nashornSyntax',
				line: syntax.line,
				column: syntax.column,
				console: output,
			});
			return;
		}
		Object.entries(args).forEach(([name, value]) => {
			if (!/^VAR_\d+$/.test(name)) throw new Error('invalidArgument');
			scope[name] = toServerArg(value);
		});
		scope.RESULT_VAR = undefined;
		[
			'fetch',
			'XMLHttpRequest',
			'WebSocket',
			'EventSource',
			'importScripts',
			'indexedDB',
			'caches',
			'BroadcastChannel',
			'Worker',
			'SharedWorker',
			'postMessage',
			'close',
			'setTimeout',
			'setInterval',
			'addEventListener',
			'removeEventListener',
			'navigator',
			'onmessage',
			'onerror',
		].forEach((name) => replace(scope, name, undefined));
		unsupportedGlobals
			.filter((name) => name !== 'console' && name !== 'fetch')
			.forEach((name) => replace(scope, name, unavailable(name)));
		unsupportedMethods.forEach((name) => {
			[Array.prototype, String.prototype].forEach((prototype) => {
				if (name in prototype) replace(prototype, name, unavailable(name));
			});
		});
		Object.entries(unsupportedStatics).forEach(([owner, names]) => {
			const target = scope[owner];
			if (typeof target === 'function' || (typeof target === 'object' && target !== null)) {
				names.forEach((name) => replace(target, name, unavailable(`${owner}.${name}`)));
			}
		});
		replace(scope, 'print', log);
		replace(scope, 'console', { log });
		replace(scope, 'Java', {
			type: serverOnly('Java.type'),
			from: serverOnly('Java.from'),
		});
		replace(scope, 'load', serverOnly('load'));
		const raw: unknown = evaluate(script + '\n//# sourceURL=opencelium-enhancement.js');
		const converted = toServerResult(raw);
		send({
			kind: 'value',
			value: converted.value,
			serverType: converted.serverType,
			console: output,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		const stack = error instanceof Error ? error.stack : undefined;
		const location = stack?.match(/(?:opencelium-enhancement\.js|<anonymous>):(\d+):(\d+)/);
		send({
			kind: 'error',
			message:
				/unsafe-eval|Content Security Policy|blocked by CSP|code generation from strings disallowed/i.test(
					message,
				)
					? 'csp'
					: error instanceof TypeError ||
						  error instanceof ReferenceError ||
						  error instanceof RangeError
						? `${error.name}: ${message}`
						: message,
			line: location ? Number(location[1]) : undefined,
			column: location ? Number(location[2]) - 1 : undefined,
			console: output,
		});
	}
};
