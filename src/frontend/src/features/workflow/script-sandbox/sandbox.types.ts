import type { ServerType } from './simulateBindings';

export type SandboxRequest = { script: string; args: Record<string, unknown> };
export type SandboxResult =
	| { kind: 'value'; value: unknown; serverType: ServerType; console: string[] }
	| {
			kind: 'error';
			message: string;
			line?: number;
			column?: number;
			console: string[];
	  }
	| { kind: 'timeout' };

export function assertNever(value: never): never {
	throw new Error(`Unexpected kind: ${String(value)}`);
}
