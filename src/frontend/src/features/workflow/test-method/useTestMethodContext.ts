import { useState } from 'react';
import { buildFromConnectorPayload } from '../api/connectionPayload';
import { buildEditorConnection } from '../components/request-editor/editorConnection';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { collectMethodReferences } from './collectMethodReferences';
import { buildTestInputStorageKey } from './testMethodInputStorage';

type Args = {
	nodeId: string;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings: readonly unknown[] | undefined;
	connectionId: number | null;
};

// Snapshotted when the dialog opens: the test runs against the graph as it was
// then, so editing elsewhere while the dialog is open never reshuffles its rows.
export function useTestMethodContext({ nodeId, nodes, edges, fieldBindings, connectionId }: Args) {
	const [context] = useState(() => {
		// The save payload is the backend's own method shape (references wrapped in
		// `{% %}` in the endpoint, serialized headers/body), so the test sends exactly
		// what a save would; the editor connection is the shape the reference
		// resolvers read (tree-path indices, sample responses).
		const draft = buildFromConnectorPayload(nodes, edges).methods.find((method) => method.id === nodeId);
		const connection = buildEditorConnection(nodes, edges, fieldBindings);
		const currentMethod = connection.fromConnector.method.find((method) => method.id === nodeId);
		if (!draft) return null;
		return {
			draft,
			connection,
			currentMethod,
			inputs: collectMethodReferences(draft, connection),
			storageKey: buildTestInputStorageKey(connectionId, draft.color),
		};
	});
	return context;
}
