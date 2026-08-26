import { useMemo } from 'react';
import type { Connection } from '../../types/connection';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import { getMethodConnectorIcon } from '../request-editor/body-editor/requestReferenceOptions';
import type { ConditionGroup } from './conditionBuilder.types';
import {
	buildNodeBackedMethods,
	getCurrentLoopIterator,
	getFirstRuleLeftField,
	getFirstRuleOperator,
	getPreviousIterators,
	getSourceMethods,
} from './conditionBuilderDialog.utils';
import {
	parseMethodFromReference,
	parseResponseTypeFromReference,
} from './conditionBuilder.utils';

export const useConditionBuilderData = (
	connection: Connection,
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
	node: WorkflowNodeModel | null,
	tree: ConditionGroup,
	isLoop: boolean,
) => {
	const methods = useMemo(() => getSourceMethods(connection, nodes, edges, node),
		[connection, edges, node, nodes]);
	const allMethods = useMemo(() => buildNodeBackedMethods(
		connection.fromConnector.method, nodes,
	), [connection.fromConnector.method, nodes]);
	const iterators = useMemo(() => getPreviousIterators(connection, node), [connection, node]);
	const loopIterator = useMemo(() => getCurrentLoopIterator(connection, node), [connection, node]);
	const collectionReference = useMemo(
		() => isLoop ? getFirstRuleLeftField(tree) : undefined,
		[isLoop, tree],
	);
	const loopOperator = useMemo(
		() => isLoop ? getFirstRuleOperator(tree) : undefined,
		[isLoop, tree],
	);
	const loopExample = useMemo(() => {
		if (!isLoop || !loopOperator || !collectionReference) return undefined;
		const method = parseMethodFromReference(allMethods, collectionReference);
		if (!method) return undefined;
		return {
			methodLabel: method.label || method.name,
			connectorIcon: getMethodConnectorIcon(method),
			hasMethod: true,
			responseType: parseResponseTypeFromReference(collectionReference) || 'body',
		};
	}, [allMethods, collectionReference, isLoop, loopOperator]);

	return { methods, allMethods, iterators, loopIterator, loopOperator, loopExample };
};
