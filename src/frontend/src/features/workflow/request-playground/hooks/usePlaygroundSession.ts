import { useMemo, useState } from 'react';
import type { Connector } from '@entities/connector/model/types';
import { buildFromConnectorPayload } from '../../api/connectionPayload';
import { buildMethodPayload } from '../../api/connectionPayload.methods';
import { buildEditorConnection } from '../../components/request-editor/editorConnection';
import type { WorkflowMethodConfig } from '../../types/request-config.types';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import { ensureMethodConfig } from '../../utils/requestConfig';
import { collectPlaygroundInputs } from '../model/collectPlaygroundInputs';
import { connectorsOfInvoker, readConnectionFieldNames } from '../model/playgroundConnection';
import { buildInputStorageKey } from '../model/playgroundStorage';
import { applyRequestEdits, hasRequestEdits, type RequestEdits } from '../model/requestEdits';

type Args = {
	node: WorkflowNodeModel;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings: readonly unknown[] | undefined;
	connectionId: number | null;
	connectors: readonly Connector[];
};

const readOperatorPath = (methodIndex: string, operators: { index: string; type: string; iterator?: string }[]) =>
	operators
		.filter((operator) => methodIndex.startsWith(`${operator.index}_`))
		.sort((a, b) => a.index.length - b.index.length)
		.map(({ type, iterator }) => ({ type, iterator }));

// Snapshotted when the dialog opens: the test runs against the graph as it was
// then, so editing elsewhere while the dialog is open never reshuffles its rows.
function snapshotSession({ node, nodes, edges, fieldBindings, connectionId }: Args) {
	const payload = buildFromConnectorPayload(nodes, edges);
	const baseDraft = payload.methods.find((method) => method.id === node.id);
	if (!baseDraft) return null;
	const connection = buildEditorConnection(nodes, edges, fieldBindings);
	return {
		baseNode: node,
		baseDraft,
		baseConfig: ensureMethodConfig(node.data.methodConfig),
		connection,
		fieldBindings: connection.fieldBindings,
		currentMethod: connection.fromConnector.method.find((method) => method.id === node.id),
		operatorPath: readOperatorPath(baseDraft.index, payload.operators),
		storageKey: buildInputStorageKey(connectionId, baseDraft.color),
	};
}

export function usePlaygroundSession(args: Args) {
	const [snapshot] = useState(() => snapshotSession(args));
	const [edits, setEdits] = useState<RequestEdits>({});
	const [connectorId, setConnectorId] = useState<number | null>(args.node.data.connector?.connectorId ?? null);

	const connectors = useMemo(() => connectorsOfInvoker(args.connectors, args.node.data.connector?.invokerName),
		[args.connectors, args.node.data.connector?.invokerName]);
	const connector = connectors.find((item) => item.connectorId === connectorId);
	const connectionFieldNames = useMemo(() => readConnectionFieldNames(connector), [connector]);

	const config: WorkflowMethodConfig | null = useMemo(
		() => snapshot && applyRequestEdits(snapshot.baseConfig, edits), [snapshot, edits]);
	const draft = useMemo(() => {
		if (!snapshot || !config) return null;
		const { baseNode, baseDraft } = snapshot;
		const node = { ...baseNode, data: { ...baseNode.data, methodConfig: config } };
		return buildMethodPayload(node, baseDraft.index, 0, baseDraft.color, baseDraft.jump);
	}, [snapshot, config]);
	const inputs = useMemo(() => snapshot && draft
		&& collectPlaygroundInputs(draft, snapshot.connection, connectionFieldNames),
	[snapshot, draft, connectionFieldNames]);

	if (!snapshot || !config || !draft || !inputs) return null;
	const fixedHeaders = connector?.invoker?.operations?.find((operation) => operation.name === config.name)
		?.request?.header ?? {};
	return {
		...snapshot,
		config,
		draft,
		inputs,
		edits,
		setEdits,
		hasEdits: hasRequestEdits(edits),
		connectors,
		connector,
		connectorId,
		setConnectorId,
		connectionFieldNames,
		fixedHeaders,
	};
}

export type PlaygroundSession = NonNullable<ReturnType<typeof usePlaygroundSession>>;
