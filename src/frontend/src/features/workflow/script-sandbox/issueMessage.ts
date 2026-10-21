import type { CompatibilityIssue } from './checkNashornCompatibility';
import { assertNever } from './sandbox.types';

export function issueMessage(
	issue: CompatibilityIssue,
	t: (key: string, options?: Record<string, unknown>) => string,
) {
	switch (issue.kind) {
		case 'syntax':
			return t(`sandbox.${issue.message}`);
		case 'unsupportedBuiltin':
			return t('sandbox.builtin', { name: issue.message });
		case 'serverOnly':
			return t(issue.message === 'nashornSyntax' ? 'sandbox.nashornSyntax' : 'sandbox.serverOnly', {
				name: issue.message,
			});
		case 'timezone':
			return t('sandbox.timezone');
		default:
			return assertNever(issue.kind);
	}
}
