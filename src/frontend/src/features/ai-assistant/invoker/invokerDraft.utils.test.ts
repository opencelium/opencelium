import { describe, expect, it } from 'vitest';
import type { InvokerDraft, InvokerDraftOperation } from '../model/aiGateway.types';
import { SELECT_ALL_UP_TO, defaultSelection, filterOperations, isTestCandidate, reviewedDraft, toInvokerName } from './invokerDraft.utils';

const operation = (name: string, method: InvokerDraftOperation['method'], path: string, group = ''): InvokerDraftOperation => ({
	name, method, path, summary: '', group, request: null, response: { status: '200', type: 'object', fields: [] },
});

const draft: InvokerDraft = {
	name: 'Desk', description: '', hint: '', category: '', auth: { kind: 'bearer', keyName: '' }, baseUrl: '',
	operations: [operation('GetTickets', 'GET', '/tickets', 'tickets'), operation('GetTicket', 'GET', '/tickets/{id}', 'tickets'),
		operation('CreateUser', 'POST', '/users', 'users')],
	testOperation: 'GetTickets',
};

describe('toInvokerName', () => {
	it('keeps only the characters an invoker name allows', () => {
		expect(toInvokerName('Jira Cloud platform – REST API v3')).toBe('Jira Cloud platform REST API v3');
		expect(toInvokerName('..Weird/Name: ä..v2..')).toBe('Weird Name .v2');
		expect(toInvokerName('***')).toBe('API');
	});
});

describe('defaultSelection', () => {
	it('selects a small API whole and only the test operation of a large one', () => {
		expect([...defaultSelection(draft)]).toEqual(['GetTickets', 'GetTicket', 'CreateUser']);
		const large = { ...draft, operations: Array.from({ length: SELECT_ALL_UP_TO + 1 }, (_, index) => operation(`Op${index}`, 'GET', '/x')) };
		expect([...defaultSelection(large)]).toEqual(['GetTickets']);
	});
});

describe('filterOperations', () => {
	it('matches every word against name, method, path, group and summary', () => {
		expect(filterOperations(draft.operations, 'get tickets').map((op) => op.name)).toEqual(['GetTickets', 'GetTicket']);
		expect(filterOperations(draft.operations, 'users').map((op) => op.name)).toEqual(['CreateUser']);
		expect(filterOperations(draft.operations, '  ')).toHaveLength(3);
	});
});

describe('reviewedDraft', () => {
	it('keeps the chosen operations and drops a test operation that is no longer among them', () => {
		const reviewed = reviewedDraft(draft, new Set(['GetTicket', 'CreateUser']), { name: 'Desk: v2', baseUrl: ' https://desk.test ', testOperation: 'GetTickets',
			auth: { kind: 'apikeyHeader', keyName: ' X-Key ' } });
		expect(reviewed.operations.map((op) => op.name)).toEqual(['GetTicket', 'CreateUser']);
		expect(reviewed).toMatchObject({ name: 'Desk v2', baseUrl: 'https://desk.test', testOperation: '', auth: { kind: 'apikeyHeader', keyName: 'X-Key' } });
	});

	it('only offers parameterless reads as a connection test', () => {
		expect(draft.operations.map(isTestCandidate)).toEqual([true, false, false]);
	});
});
