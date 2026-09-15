import { formatParsedArgPath, parseEnhancementArg }
	from '../components/request-editor/utils/parseEnhancementArg';
import type { Connection, Enhancement } from '../types/connection';
import type { EnhancementScriptArg } from './enhancementScript.types';

const VAR_KEY = /^VAR_\d+$/;

const methodNameFor = (connection: Connection | null, color: string) => {
	const method = (connection?.fromConnector.method ?? []).find(
		(candidate) => candidate.color.toLowerCase() === color.toLowerCase());
	return method?.label || method?.name || color;
};

/**
 * The inputs the script receives, in `VAR_0`…`VAR_n` order — numerically, since `VAR_10`
 * sorts before `VAR_2` as a string and the model would be told the wrong argument order.
 */
export const buildEnhancementScriptArgs = (
	connection: Connection | null,
	enhancement: Enhancement,
): EnhancementScriptArg[] =>
	Object.entries(enhancement.args ?? {})
		.filter(([key]) => VAR_KEY.test(key))
		.sort(([left], [right]) => Number(left.slice(4)) - Number(right.slice(4)))
		.flatMap(([name, reference]) => {
			const parsed = parseEnhancementArg(reference);
			return parsed
				? [{ name, path: formatParsedArgPath(parsed),
					methodName: methodNameFor(connection, parsed.color) }]
				: [];
		});

/** Where the script writes, for context on the shape the target field expects. */
export const buildEnhancementResultPath = (enhancement: Enhancement) => {
	const parsed = parseEnhancementArg(enhancement.args?.RESULT_VAR ?? '');
	return parsed ? formatParsedArgPath(parsed) : '';
};
