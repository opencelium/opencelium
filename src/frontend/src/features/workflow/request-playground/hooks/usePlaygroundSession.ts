import { useEffect, useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import type { Connector } from '@entities/connector/model/types';
import { readServerMessage } from '../model/readServerMessage';
import { buildFromConnectorPayload } from '../../api/connectionPayload';
import { buildMethodPayload } from '../../api/connectionPayload.methods';
import { buildEditorConnection } from '../../components/request-editor/editorConnection';
import type { WorkflowMethodConfig } from '../../types/request-config.types';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import { ensureMethodConfig } from '../../utils/requestConfig';
import { collectPlaygroundInputs } from '../model/collectPlaygroundInputs';
import { useGetMethodTestRefsQuery } from '../model/playgroundApi';
import type { PlaygroundDraft } from '../model/playground.types';
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

const REFS_DEBOUNCE_MS = 400;

// /refs is re-read while the user edits the request; debounced so typing in the URL
// does not fire a request per keystroke.
function useMethodTestRefs(draft: PlaygroundDraft | null) {
	const [settledDraft, setSettledDraft] = useState(draft);
	useEffect(() => {
		const timer = setTimeout(() => setSettledDraft(draft), REFS_DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [draft]);
	const query = useGetMethodTestRefsQuery(settledDraft ?? skipToken);
	const isStale = settledDraft !== draft;
	return {
		refs: query.data,
		isLoading: isStale || query.isFetching,
		error: query.isError && !query.isFetching ? readServerMessage(query.error) : null,
		refetch: () => { if (settledDraft) void query.refetch(); },
	};
}

export function usePlaygroundSession(args: Args) {
	const [snapshot] = useState(() => snapshotSession(args));
	const [edits, setEdits] = useState<RequestEdits>({});
	const connectorId = args.node.data.connector?.connectorId ?? null;

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

	const refs = useMethodTestRefs(draft);

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
		connector,
		connectorId,
		allConnectors: args.connectors,
		refs,
		connectionFieldNames,
		fixedHeaders,
	};
}

export type PlaygroundSession = NonNullable<ReturnType<typeof usePlaygroundSession>>;
