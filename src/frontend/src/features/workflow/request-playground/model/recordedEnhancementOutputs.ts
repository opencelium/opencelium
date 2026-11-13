import type { DetailedMethodLog } from '@features/logs';
import { readLiveValueAtPath } from '../../components/request-editor/body-editor/requestReferenceOptions';
import { checkNashornCompatibility } from '../../script-sandbox/checkNashornCompatibility';
import type { SandboxRequest, SandboxResult } from '../../script-sandbox/sandbox.types';
import type { PlaygroundRequest } from './playground.types';

type Binding = {
	enhancement?: { language?: string; expertCode?: string };
	from?: Array<{ color: string; type: string; field: string }>;
	to?: Array<{ color: string; type: string; field: string }>;
};

const parseLogged = (value?: string) => {
	if (value === undefined) return undefined;
	try { return JSON.parse(value) as unknown; }
	catch { return undefined; }
};

const reference = ({ color, type, field }: NonNullable<Binding['to']>[number]) => `${color}.(${type}).${field}`;

function runEnhancement(request: SandboxRequest, signal: AbortSignal): Promise<SandboxResult> {
	return new Promise((resolve, reject) => {
		signal.throwIfAborted();
		const worker = new Worker(new URL('../../script-sandbox/sandbox.worker.ts', import.meta.url), { type: 'module' });
		const stop = () => {
			clearTimeout(timer);
			signal.removeEventListener('abort', cancel);
			worker.terminate();
		};
		const cancel = () => { stop(); reject(signal.reason); };
		const timer = setTimeout(() => { stop(); resolve({ kind: 'timeout' }); }, 2000);
		signal.addEventListener('abort', cancel, { once: true });
		worker.onmessage = ({ data }: MessageEvent<SandboxResult>) => { stop(); resolve(data); };
		worker.onerror = (error) => { stop(); reject(error); };
		try { worker.postMessage(request); }
		catch (error) { stop(); reject(error); }
	});
}

export async function addRecordedEnhancementOutputs(
	input: PlaygroundRequest,
	log: DetailedMethodLog,
	signal: AbortSignal,
	run = runEnhancement,
): Promise<boolean> {
	const outputs: NonNullable<PlaygroundRequest['enhancementOutputs']> = [];
	const values = new Map(input.references.map((value) => [value.reference, value]));
	for (const binding of input.fieldBindings as Binding[]) {
		const args = (binding.from ?? []).map((source) => values.get(reference(source)));
		let recalculated: Extract<SandboxResult, { kind: 'value' }> | undefined;
		if (args.some((arg) => arg?.isOverridden)) {
			const script = binding.enhancement?.expertCode;
			if (binding.enhancement?.language !== 'js' || !script || args.some((arg) => !arg)
				|| checkNashornCompatibility(script).some(({ kind }) => kind !== 'timezone')) return false;
			try {
				const result = await run({
					script,
					args: Object.fromEntries(args.map((arg, index) => [`VAR_${index}`, arg?.value])),
				}, signal);
				if (result.kind !== 'value') return false;
				recalculated = result;
			} catch {
				signal.throwIfAborted();
				return false;
			}
		}
		if (!binding.to?.length) return false;
		for (const target of binding.to) {
			const separator = target.field.indexOf('.');
			const section = target.field.slice(0, separator);
			if (section !== 'body' && section !== 'header') return false;
			const path = target.field.slice(separator + 1);
			const request = log.segment?.request;
			const logged = section === 'body' ? request?.payload : section === 'header' ? request?.header : undefined;
			const value = recalculated ? recalculated.value : readLiveValueAtPath(parseLogged(logged), path, () => null);
			if (value === undefined) return false;
			outputs.push({
				section, path,
				value: section === 'header' && Array.isArray(value) ? value.join(', ') : value,
			});
		}
	}
	input.enhancementOutputs = outputs;
	return true;
}
