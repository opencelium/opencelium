import { describe, expect, it } from 'vitest';
import { buildConditionConfig } from '../components/condition-builder/conditionBuilder.utils';
import { generateTreeByExpression } from '../components/condition-builder/conditionExpressionParser';
import { createEmptyGroup } from '../components/condition-builder/conditionTreeFactory';
import { mapConnectionToWorkflowState } from './connectionMapper';

const RESPONSE = '{%#FFCFB5.(response).body.$.[0].monitorSerialnumber1%}';
const REQUEST = '{%#FFCFB5.(request).body.$.limit%}';

describe('legacy 4.8 IF conditions', () => {
	it('parses nested AND/OR/NOT with request, webhook and numeric operands', () => {
		const tree = generateTreeByExpression(
			`((${RESPONSE} NotEmpty && ${REQUEST} >= 5) || !(${ '${payload.enabled}' } = 'false'))`,
			'if',
		);

		expect(tree?.properties).toMatchObject({ conjunction: '||', not: false });
		expect(tree?.items).toHaveLength(2);
		const andGroup = tree?.items?.[0];
		expect(andGroup?.type).toBe('group');
		if (andGroup?.type !== 'group') throw new Error('Expected nested AND group');
		expect(andGroup.properties).toMatchObject({ conjunction: '&&', not: false });
		expect(andGroup.items?.[0]).toMatchObject({
			type: 'rule', properties: { leftField: '#FFCFB5.(response).body.$.[0].monitorSerialnumber1', operator: 'NotEmpty' },
		});
		expect(andGroup.items?.[1]).toMatchObject({
			type: 'rule', properties: { leftField: '#FFCFB5.(request).body.$.limit', operator: '>=', rightField: '5' },
		});
		const notGroup = tree?.items?.[1];
		expect(notGroup?.type).toBe('group');
		if (notGroup?.type !== 'group') throw new Error('Expected NOT group');
		expect(notGroup.properties?.not).toBe(true);
		expect(notGroup.items?.[0]).toMatchObject({
			type: 'rule', properties: { leftField: '${payload.enabled}', operator: '=', rightField: 'false' },
		});
	});

	it.each([
		`(${RESPONSE} NotEmpty && {%#FFCFB5.(response).body.$.[*].monitorSerialnumber1%} NotEmpty)`,
		`(${REQUEST} >= 5 || ${RESPONSE} IsNull)`,
		`((${RESPONSE} ContainsSubStr 'ABC') && (${REQUEST} != 0 || ${RESPONSE} NotNull))`,
	])('parses a real 4.8 expression: %s', (expression) => {
		expect(generateTreeByExpression(expression, 'if')).not.toBeNull();
	});

	it('keeps the original expression when an empty fallback tree is built', () => {
		const original = '(legacy syntax that cannot be parsed)';
		const config = buildConditionConfig('if', createEmptyGroup('if'), undefined, original);
		expect(config.expression).toBe(original);
	});

	it('restores a compound expression when legacy ui.operators is missing', () => {
		const expression = `(${RESPONSE} NotEmpty && ${REQUEST} >= 5)`;
		const state = mapConnectionToWorkflowState({
			title: 'expression only', fieldBinding: [],
			fromConnector: { methods: [], operators: [
				{ type: 'if', index: '0', uiId: 'expression-if', expression },
			] },
		});
		const node = state.nodes.find((item) => item.type === 'if');
		const tree = generateTreeByExpression(node?.data.conditionConfig?.expression, 'if');
		expect(tree?.properties?.conjunction).toBe('&&');
		expect(tree?.items).toHaveLength(2);
	});

	it('restores a nested legacy ui tree and rebuilds incomplete edges', () => {
		const uiId = 'legacy-if';
		const state = mapConnectionToWorkflowState({
			title: 'legacy', fieldBinding: [],
			fromConnector: {
				methods: [{ id: 'method-1', index: '0', name: 'GetAll', methodType: 'CONNECTOR',
					connector: { connectorId: 1, title: 'fake_api' }, request: {}, response: {} }],
				operators: [{ nodeId: 'method-1', type: 'if', index: '1', uiId,
					expression: `((${RESPONSE} NotEmpty && ${REQUEST} >= 5) || !(${ '${payload.enabled}' } = 'false'))` }],
			},
			ui: {
				workflowNodes: [
					{ id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
					{ id: 'saved-method', nodeId: 'method-1', type: 'connector', position: { x: 200, y: 0 } },
				],
				workflowEdges: [{ id: 'legacy-edge', source: 'start-1', target: 'saved-method' }],
				operators: [{ id: uiId, type: 'group', properties: { not: false, conjunction: '||' }, items: [
					{ id: 'and', type: 'group', properties: { not: false, conjunction: '&&' }, items: [
						{ id: 'rule-1', type: 'rule', properties: { leftField: RESPONSE, operator: 'NotEmpty', rightField: '&nbsp' } },
						{ id: 'rule-2', type: 'rule', properties: { leftField: REQUEST, operator: '>=', rightField: '5' } },
					] },
					{ id: 'not', type: 'group', properties: { not: true }, items: [
						{ id: 'rule-3', type: 'rule', properties: { leftField: '${payload.enabled}', operator: '=', rightField: 'false' } },
					] },
				] }],
			},
		});

		const ifNode = state.nodes.find((node) => node.type === 'if');
		expect(ifNode?.id).toBe(uiId);
		expect(ifNode?.data.conditionConfig?.tree.items).toHaveLength(2);
		expect(state.edges.some((edge) => edge.target === uiId)).toBe(true);
	});

	it('restores a complete workflow with methods, nested operators, data and complex conditions', () => {
		const state = mapConnectionToWorkflowState({
			title: 'complex legacy workflow', fieldBinding: [],
			fromConnector: {
				methods: [
					{ id: 'method-root', index: '0', name: 'LoadUnits', methodType: 'CONNECTOR',
						connector: { connectorId: 1, title: 'fake_api' }, request: {}, response: {} },
					{ id: 'method-true', index: '1_0', name: 'ProcessUnit', methodType: 'CONNECTOR',
						connector: { connectorId: 1, title: 'fake_api' }, request: {}, response: {} },
					{ id: 'method-after', index: '2', name: 'Finish', methodType: 'CONNECTOR',
						connector: { connectorId: 1, title: 'fake_api' }, request: {}, response: {} },
				],
				operators: [
					{ nodeId: 'method-root', type: 'if', index: '1', uiId: 'if-root',
						dataAggregator: { function: 'first', field: 'units' },
						expression: `((${RESPONSE} NotEmpty && ${REQUEST} >= 5) || !(${ '${payload.skip}' } = 'true'))` },
					{ nodeId: 'method-true', type: 'loop', index: '1_1', uiId: 'loop-nested', iterator: 'i',
						dataAggregator: { function: 'array', field: 'items' }, expression: `for ${RESPONSE}` },
					{ nodeId: 'loop-nested', type: 'if', index: '1_1_0', uiId: 'if-deep',
						expression: `(${REQUEST} > 0 && (${RESPONSE} ContainsSubStr 'ABC' || ${RESPONSE} IsNull))` },
				],
			},
			ui: { operators: [
				{ id: 'if-root', type: 'group', properties: { not: false, conjunction: '||' }, items: [
					{ id: 'root-and', type: 'group', properties: { not: false, conjunction: '&&' }, items: [
						{ id: 'root-a', type: 'rule', properties: { leftField: RESPONSE, operator: 'NotEmpty', rightField: '&nbsp' } },
						{ id: 'root-b', type: 'rule', properties: { leftField: REQUEST, operator: '>=', rightField: '5' } },
					] },
					{ id: 'root-not', type: 'group', properties: { not: true }, items: [
						{ id: 'root-c', type: 'rule', properties: { leftField: '${payload.skip}', operator: '=', rightField: 'true' } },
					] },
				] },
				{ id: 'loop-nested', type: 'group', properties: { not: false }, items: [
					{ id: 'loop-rule', type: 'rule', properties: { leftField: RESPONSE, operator: 'for' } },
				] },
				{ id: 'if-deep', type: 'group', properties: { not: false, conjunction: '&&' }, items: [
					{ id: 'deep-a', type: 'rule', properties: { leftField: REQUEST, operator: '>', rightField: '0' } },
					{ id: 'deep-or', type: 'group', properties: { not: false, conjunction: '||' }, items: [
						{ id: 'deep-b', type: 'rule', properties: { leftField: RESPONSE, operator: 'ContainsSubStr', rightField: 'ABC' } },
						{ id: 'deep-c', type: 'rule', properties: { leftField: RESPONSE, operator: 'IsNull', rightField: '&nbsp' } },
					] },
				] },
			] },
		});

		expect(state.nodes).toHaveLength(7);
		expect(state.edges).toHaveLength(6);
		expect(state.edges).toEqual(expect.arrayContaining([
			expect.objectContaining({ source: 'method-root', target: 'if-root' }),
			expect.objectContaining({ source: 'if-root', target: 'method-true', sourceHandle: 'true' }),
			expect.objectContaining({ source: 'method-true', target: 'loop-nested' }),
			expect.objectContaining({ source: 'loop-nested', target: 'if-deep', sourceHandle: 'bottom' }),
			expect.objectContaining({ source: 'if-root', target: 'method-after', sourceHandle: 'false' }),
		]));
		const rootIf = state.nodes.find((node) => node.id === 'if-root');
		expect(rootIf?.data.dataAggregator).toEqual({ function: 'first', field: 'units' });
		expect(rootIf?.data.conditionConfig?.tree.items).toHaveLength(2);
		const loop = state.nodes.find((node) => node.id === 'loop-nested');
		expect(loop?.data.conditionConfig?.iterator).toBe('i');
		expect(loop?.data.dataAggregator).toEqual({ function: 'array', field: 'items' });
		const deepIf = state.nodes.find((node) => node.id === 'if-deep');
		expect(deepIf?.data.conditionConfig?.tree.items?.[1]).toMatchObject({
			type: 'group', properties: { conjunction: '||', not: false }, items: [{ type: 'rule' }, { type: 'rule' }],
		});
	});
});
