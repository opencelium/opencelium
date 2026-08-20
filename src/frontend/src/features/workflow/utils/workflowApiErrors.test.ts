import { describe, expect, it } from 'vitest';
import { ApiFetchError } from '@shared/api/apiFetch';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { buildFromConnectorPayload } from '../api/connectionPayload';
import { resolveWorkflowApiError } from './workflowApiErrors';

const nodes = [
	{ id: 'start-1', type: 'start', position: { x: 0, y: 0 }, data: { title: 'Start', kind: 'start' } },
	{ id: 'method-1', type: 'connector', position: { x: 240, y: 0 },
		data: { title: 'GetAllUser', subtitle: 'getAllUser', kind: 'connector' } },
	{ id: 'loop-1', type: 'loop', position: { x: 480, y: 0 }, data: { title: 'Loop', kind: 'loop' } },
] as unknown as WorkflowNodeModel[];

const edges = [
	{ id: 'e1', type: 'workflow-edge', source: 'start-1', target: 'method-1' },
	{ id: 'e2', type: 'workflow-edge', source: 'method-1', target: 'loop-1' },
] as unknown as WorkflowEdgeModel[];

const operatorError = (message: string) => new ApiFetchError(message, {
	status: 400,
	body: { status: 400, error: 'OPERATOR_EXPRESSION_IS_EMPTY', message },
});

/** The same failure as a plain 500, where only the sentence identifies it. */
const unlabelledOperatorError = (message: string) => new ApiFetchError(message, {
	status: 500,
	body: { status: 500, error: 'INTERNAL_SERVER_ERROR', message },
});

// start -> loop -> method: the loop leads the chain, so its payload index is "0".
const loopFirstNodes = [
	nodes[0],
	{ id: 'loop-first', type: 'loop', position: { x: 240, y: 0 }, data: { title: 'Loop', kind: 'loop' } },
	nodes[1],
] as unknown as WorkflowNodeModel[];
const loopFirstEdges = [
	{ id: 'e1', type: 'workflow-edge', source: 'start-1', target: 'loop-first' },
	{ id: 'e2', type: 'workflow-edge', source: 'loop-first', target: 'method-1', sourceHandle: 'right' },
] as unknown as WorkflowEdgeModel[];

describe('resolveWorkflowApiError', () => {
	it('highlights the operator the backend named, at the index the payload sent for it', () => {
		const sentIndex = buildFromConnectorPayload(nodes, edges)
			.operators.find((operator) => operator.type === 'loop')?.index;
		expect(sentIndex).toBe('1');

		const resolution = resolveWorkflowApiError(
			operatorError(`Operator (index=${sentIndex}, type=loop) has null or empty expression`),
			nodes, edges,
		);
		expect(resolution).toEqual({
			source: 'translated',
			messageKey: 'connection.messages.saveFailed.operatorExpressionEmpty',
			messageParams: { type: 'loop' },
			nodeId: 'loop-1',
		});
	});

	it('highlights an operator at index 0, whether or not the error carries its code', () => {
		const sentIndex = buildFromConnectorPayload(loopFirstNodes, loopFirstEdges)
			.operators.find((operator) => operator.type === 'loop')?.index;
		expect(sentIndex).toBe('0');

		const message = 'Operator (index=0, type=loop) has null or empty expression';
		const expected = {
			source: 'translated',
			messageKey: 'connection.messages.saveFailed.operatorExpressionEmpty',
			messageParams: { type: 'loop' },
			nodeId: 'loop-first',
		};
		expect(resolveWorkflowApiError(operatorError(message), loopFirstNodes, loopFirstEdges))
			.toEqual(expected);
		// The 500 shape must not fall through to the raw-message branch, or the operator
		// it names never turns red.
		expect(resolveWorkflowApiError(unlabelledOperatorError(message), loopFirstNodes, loopFirstEdges))
			.toEqual(expected);
	});

	it('never blames a method node when the named operator index cannot be matched', () => {
		const resolution = resolveWorkflowApiError(
			operatorError('Operator (index=0, type=loop) has null or empty expression'),
			nodes, edges,
		);
		expect(resolution).toEqual({
			source: 'translated',
			messageKey: 'connection.messages.saveFailed.operatorExpressionEmpty',
			messageParams: { type: 'loop' },
			nodeId: undefined,
		});
	});

	it('recognizes the codes that arrive as the message rather than as `error`', () => {
		// All three are thrown as plain RuntimeExceptions, so the code is the message.
		const cases = [
			['TITLE_HAS_ALREADY_TAKEN', 'titleTaken'],
			['CONNECTOR_NOT_FOUND', 'connectorNotFound'],
			['CATEGORY_NOT_FOUND', 'categoryNotFound'],
			['CONNECTION_NOT_FOUND', 'connectionNotFound'],
		] as const;
		for (const [code, key] of cases) {
			const error = new ApiFetchError(code, {
				status: 500,
				body: { status: 500, error: 'INTERNAL_SERVER_ERROR', message: code },
			});
			expect(resolveWorkflowApiError(error, nodes, edges)).toEqual({
				source: 'translated',
				messageKey: `connection.messages.saveFailed.${key}`,
			});
		}
	});

	it('matches a code that carries a suffix', () => {
		// ConnectionNotFoundException appends the id to the code.
		const message = 'CONNECTION_NOT_FOUND ; Connection - 42';
		const error = new ApiFetchError(message, {
			status: 500, body: { status: 500, error: 'INTERNAL_SERVER_ERROR', message },
		});
		expect(resolveWorkflowApiError(error, nodes, edges))
			.toEqual({ source: 'translated', messageKey: 'connection.messages.saveFailed.connectionNotFound' });
	});

	it('reads an ownership refusal as its own message, not as a generic failure', () => {
		const message = 'Only owner or admin can perform this action';
		const asForbidden = new ApiFetchError(message, {
			status: 403, body: { status: 403, error: 'FORBIDDEN', message },
		});
		// And when it degrades to a 500 with only the prose to go on.
		const asServerError = new ApiFetchError(message, {
			status: 500, body: { status: 500, error: 'INTERNAL_SERVER_ERROR', message },
		});
		const expected = { source: 'translated', messageKey: 'connection.messages.saveFailed.notOwner' };
		expect(resolveWorkflowApiError(asForbidden, nodes, edges)).toEqual(expected);
		expect(resolveWorkflowApiError(asServerError, nodes, edges)).toEqual(expected);
	});

	it('passes on the backend\'s own message when the code is not one we have copy for', () => {
		const error = new ApiFetchError('Connection has no methods', {
			status: 400,
			body: { status: 400, error: 'INVALID_DATA', message: 'Connection has no methods' },
		});
		expect(resolveWorkflowApiError(error, nodes, edges))
			.toEqual({ source: 'backend', message: 'Connection has no methods' });
	});

	it('leaves failures with nothing to say to the caller\'s generic message', () => {
		expect(resolveWorkflowApiError(new Error('boom'), nodes, edges)).toBeNull();
		const bodiless = new ApiFetchError('Internal Server Error', { status: 500 });
		expect(resolveWorkflowApiError(bodiless, nodes, edges)).toBeNull();
	});
});
