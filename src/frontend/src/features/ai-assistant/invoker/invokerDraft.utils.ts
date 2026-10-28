import { INVOKER_NAME_MAX_LENGTH } from '@entities/invoker/lib/invokerName';
import type { InvokerDraft, InvokerDraftOperation } from '../model/aiGateway.types';

// Small APIs are taken whole; a large one (Netbox: 800+ operations) is picked from, or the invoker drowns workflows.
export const SELECT_ALL_UP_TO = 40;

/**
 * An API title as an invoker name: the backend allows letters, digits, spaces and `_().-`, no leading, trailing or
 * double dots. "Jira Cloud platform – REST API v3" becomes "Jira Cloud platform REST API v3".
 */
export function toInvokerName(title: string): string {
	const name = title
		.replace(/[^A-Za-z0-9 _().-]+/g, ' ')
		.replace(/\.{2,}/g, '.')
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/^[.\s]+|[.\s]+$/g, '')
		.slice(0, INVOKER_NAME_MAX_LENGTH)
		.trim();
	return name || 'API';
}

export function defaultSelection(draft: InvokerDraft): Set<string> {
	if (draft.operations.length <= SELECT_ALL_UP_TO) return new Set(draft.operations.map((operation) => operation.name));
	return new Set(draft.testOperation ? [draft.testOperation] : []);
}

export function filterOperations(operations: InvokerDraftOperation[], query: string): InvokerDraftOperation[] {
	const words = query.toLowerCase().split(/\s+/).filter(Boolean);
	if (words.length === 0) return operations;
	return operations.filter((operation) => {
		const text = `${operation.name} ${operation.method} ${operation.path} ${operation.group} ${operation.summary}`.toLowerCase();
		return words.every((word) => text.includes(word));
	});
}

/** A GET without placeholders can check a connector's settings with nothing filled in. */
export const isTestCandidate = (operation: InvokerDraftOperation) => operation.method === 'GET' && !operation.path.includes('{');

/** The draft as reviewed: only the chosen operations, and a test operation among them (or none). */
export function reviewedDraft(draft: InvokerDraft, selected: ReadonlySet<string>,
	edits: Pick<InvokerDraft, 'name' | 'baseUrl' | 'testOperation' | 'auth'>): InvokerDraft {
	const operations = draft.operations.filter((operation) => selected.has(operation.name));
	const testOperation = operations.some((operation) => operation.name === edits.testOperation) ? edits.testOperation : '';
	return { ...draft, name: toInvokerName(edits.name), baseUrl: edits.baseUrl.trim(), auth: { ...edits.auth, keyName: edits.auth.keyName.trim() },
		operations, testOperation };
}
