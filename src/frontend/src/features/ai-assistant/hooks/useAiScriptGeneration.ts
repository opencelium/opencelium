import { useEffect, useRef, useState } from 'react';
import type { Enhancement } from '@features/workflow/types/connection';
import { useEnhancementArgs } from '@features/workflow/components/request-editor/enhancement/EnhancementArgs/useEnhancementArgs';
import { readInputs } from '@features/workflow/components/request-editor/enhancement/ScriptPlayground/playgroundInputs';
import { apiExecutor } from '@shared/api/apiExecutor';
import { isApiExecutorError } from '@shared/api/isApiExecutorError';
import { runtimeConfig } from '@shared/config/runtimeConfig';
import { isAiConfigured } from '../api/aiApi';
import type { AiHealth, GenerateScriptRequest, GenerateScriptResponse } from '../model/aiGateway.types';
import { type AiGenerationError, toAiGenerationError } from '../utils/aiGenerationError.utils';

export type AiScriptState =
	| { status: 'idle' }
	| { status: 'generating'; startedAt: number }
	| { status: 'done'; problems: string[] }
	| { status: 'error'; error: Exclude<AiGenerationError, { failure: 'aborted' }> };

const VAR_RE = /^VAR_\d+$/;
// The method dialog renders in its own Redux store without the RTK Query middleware, so this talks to the gateway
// through apiExecutor (app store, same baseQuery) instead of the aiApi hooks.
const quiet = { ignoreError: true };

/**
 * Generates a transformation script from a prompt. The model gets what the editor knows: where each VAR_n comes from,
 * the values tried in the playground for this script, the target field and the current script.
 */
export function useAiScriptGeneration(enhancement: Enhancement) {
	const isConfigured = isAiConfigured();
	const [isAvailable, setIsAvailable] = useState(false);
	const { entries } = useEnhancementArgs(enhancement);
	const [state, setState] = useState<AiScriptState>({ status: 'idle' });
	// Each request gets a number; Cancel and a newer request make an older answer stale.
	const requestId = useRef(0);

	useEffect(() => {
		if (!isConfigured) return;
		let isCurrent = true;
		void apiExecutor({ url: `${runtimeConfig.aiUrl}/health`, method: 'GET', options: quiet }).then((health: unknown) => {
			if (isCurrent) setIsAvailable(!isApiExecutorError(health) && (health as AiHealth | undefined)?.status === 'ok');
		});
		return () => {
			isCurrent = false;
		};
	}, [isConfigured]);

	const describe = (key: string) => {
		const entry = entries.find((candidate) => candidate.key === key);
		return entry ? `${entry.methodName} › ${entry.direction} ${entry.messageProperty}.$.${entry.path}` : enhancement.args[key] ?? '';
	};

	const generate = async (prompt: string, currentScript: string): Promise<GenerateScriptResponse | undefined> => {
		const samples = readInputs(enhancement.enhanceId);
		const inputs = Object.keys(enhancement.args).filter((name) => VAR_RE.test(name))
			.sort((left, right) => Number(left.slice(4)) - Number(right.slice(4)))
			.map((name) => ({
				name, source: describe(name),
				...(samples[name]?.mode === 'missing' || !samples[name]?.text ? {} : { sample: samples[name]?.text.slice(0, 2000) }),
			}));
		const body: GenerateScriptRequest = { prompt, target: describe('RESULT_VAR'), inputs, currentScript };
		const id = ++requestId.current;
		setState({ status: 'generating', startedAt: Date.now() });
		const response: unknown = await apiExecutor({
			url: `${runtimeConfig.aiUrl}/script/generate`, method: 'POST', body,
			options: { ...quiet, skipEntityInvalidation: true },
		});
		if (id !== requestId.current) return undefined;
		if (isApiExecutorError(response)) {
			const failure = toAiGenerationError(response);
			setState(failure.failure === 'aborted' ? { status: 'idle' } : { status: 'error', error: failure });
			return undefined;
		}
		const result = response as GenerateScriptResponse;
		setState({ status: 'done', problems: result.problems });
		return result;
	};

	const cancel = () => {
		requestId.current += 1;
		setState({ status: 'idle' });
	};

	return { isAvailable: isConfigured && isAvailable, state, generate, cancel };
}
