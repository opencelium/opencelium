/// <reference types="node" />

import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { transpileModule, ModuleKind, ScriptTarget } from 'typescript';
import * as compatibility from './checkNashornCompatibility';
import * as bindings from './simulateBindings';
import type { SandboxRequest, SandboxResult } from './sandbox.types';

const source = transpileModule(
	readFileSync('src/features/workflow/script-sandbox/sandbox.worker.ts', 'utf8'),
	{
		compilerOptions: {
			module: ModuleKind.CommonJS,
			target: ScriptTarget.ES2022,
		},
	},
).outputText;
export function execute(request: SandboxRequest, timeout = 1000, blockEval = false) {
	let result: SandboxResult | undefined;
	const context = createContext(
		{
			exports: {},
			require: (name: string) => (name === './checkNashornCompatibility' ? compatibility : bindings),
			postMessage: (value: SandboxResult) => {
				result = value;
			},
			request,
		},
		{ codeGeneration: { strings: !blockEval, wasm: false } },
	);
	runInContext(source, context);
	runInContext('onmessage({data: request})', context, { timeout });
	return result;
}
