import { assertNever, type CompatibilityIssue } from './sandbox.types';

export function issueMessage(
	issue: CompatibilityIssue,
	t: (key: string, options?: Record<string, unknown>) => string,
) {
	switch (issue.kind) {
		case 'syntax':
			return issue.hint;
		case 'unsupportedBuiltin':
			return t('sandbox.builtin', { name: issue.name });
		case 'console':
			return t('sandbox.consoleLog');
		case 'serverOnly':
			return t('sandbox.serverOnly', { name: issue.name });
		default:
			return assertNever(issue);
	}
}
