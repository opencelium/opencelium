import { useCallback, useMemo, useState } from 'react';
import { NOT_EXIST_ARG } from '../../../../utils/enhancementArgs';
import { useWriteEnhancementScriptMutation } from '../../../../ai/enhancementScriptApi';
import { buildEnhancementResultPath, buildEnhancementScriptArgs }
	from '../../../../ai/buildEnhancementScriptRequest';
import type { EnhancementScriptResponse } from '../../../../ai/enhancementScript.types';
import type { Connection, Enhancement } from '../../../../types/connection';

type Params = {
	enhancement: Enhancement;
	connection: Connection | null;
};

export function useEnhancementAssistant({ enhancement, connection }: Params) {
	const [write, { isLoading, isError }] = useWriteEnhancementScriptMutation();
	const [instruction, setInstruction] = useState('');
	const [proposal, setProposal] = useState<EnhancementScriptResponse | null>(null);

	const args = useMemo(() => buildEnhancementScriptArgs(connection, enhancement),
		[connection, enhancement]);

	/** dropEnhancementArgs leaves this marker wherever an input the script used has gone. */
	const isBroken = String(enhancement.script ?? '').includes(NOT_EXIST_ARG);

	const base = useMemo(() => ({
		language: enhancement.language,
		resultPath: buildEnhancementResultPath(enhancement),
		args,
	}), [args, enhancement]);

	const generate = useCallback(async () => {
		const trimmed = instruction.trim();
		if (!trimmed) return;
		const result = await write({ ...base, intent: 'generate', instruction: trimmed });
		if (result.data) setProposal(result.data);
	}, [base, instruction, write]);

	const repair = useCallback(async () => {
		const result = await write({
			...base, intent: 'repair', script: String(enhancement.script ?? ''),
		});
		if (result.data) setProposal(result.data);
	}, [base, enhancement.script, write]);

	return {
		argCount: args.length,
		discard: () => setProposal(null),
		generate,
		instruction,
		isBroken,
		isError,
		isLoading,
		proposal,
		repair,
		setInstruction,
	};
}
