import type { SandboxResult } from '@features/workflow/script-sandbox/sandbox.types';
import { formatSandboxValue } from './formatSandboxValue';

export type ComparisonVerdict = 'pending' | 'same' | 'different';

const fingerprint = (result: SandboxResult): string => {
	switch (result.kind) {
		case 'value':
			return `value:${result.serverType}:${formatSandboxValue(result.value)}`;
		case 'error':
			return `error:${result.message}`;
		case 'timeout':
			return 'timeout';
	}
};

/** Same server type and printed value (or the same error) counts as the same result; console output does not. */
export function compareSandboxResults(
	current: SandboxResult | null,
	candidate: SandboxResult | null,
): ComparisonVerdict {
	if (!current || !candidate) return 'pending';
	return fingerprint(current) === fingerprint(candidate) ? 'same' : 'different';
}
