import { useCallback, useEffect, useMemo, useRef } from 'react';
import { buildFromConnectorPayload } from '../../../api/connectionPayload';
import { clearConnection, setConnection, setFlowchart } from '../../../store/connection/connectionSlice';
import { createLegacyStore } from '../../../store';
import { buildLegacyConnection, extractWorkflowMethodConfig } from '../legacyAdapter';
import { sortValue } from '../../../utils/workflowPage.utils';
import { toAuthoredMethodConfig } from '../../../utils/requestConfig';
import type { WorkflowMethodConfig } from '../../../types/request-config.types';
import type { MethodConfigDialogProps } from './MethodConfigDialog.types';

// Identity of the method config alone, on its *authored* subset
// (toAuthoredMethodConfig) with stable key order: each extraction re-derives the
// query-param rows and mints a fresh id for the editor's trailing template row,
// so raw equality would never hold even for an untouched dialog. Comparing the
// config on its own — rather than together with the field bindings — is what
// lets an enhancement-only edit close without also rewriting the graph.
const configIdentity = (config: WorkflowMethodConfig | null) =>
	JSON.stringify(sortValue(toAuthoredMethodConfig(config ?? undefined) ?? null) ?? null);

const bindingsIdentity = (fieldBindings: unknown) =>
	JSON.stringify(sortValue(fieldBindings ?? null) ?? null);

export function useMethodConfigDialogState({ open, node, mode, nodes, edges,
	fieldBindings, onFieldBindingsChange, onClose, onSave }: MethodConfigDialogProps) {
	const store = useMemo(() => createLegacyStore(), []);
	const connection = useMemo(() => {
		const legacyConnection = buildLegacyConnection(nodes);
		const fromConnectorPayload = buildFromConnectorPayload(nodes, edges ?? []) as any;
		const indexById = new Map<string, string>(
			(fromConnectorPayload.methods ?? []).map((method: any) => [method.id, method.index]),
		);
		return {
			...legacyConnection,
			...(Array.isArray(fieldBindings) ? { fieldBindings } : {}),
			fromConnector: {
				...legacyConnection.fromConnector,
				method: legacyConnection.fromConnector.method.map((method) => ({
					...method,
					index: indexById.get(method.id) ?? method.index,
				})),
				operator: fromConnectorPayload.operators ?? [],
			},
			ui: { ...legacyConnection.ui, workflowEdges: edges ?? [] } as any,
		};
	}, [edges, fieldBindings, nodes]);
	const isPersistingRef = useRef(false);
	const activeSessionRef = useRef<string | null>(null);
	// What this session started from, captured after the legacy store is seeded so
	// it already reflects the adapter's own normalisation. The two halves are
	// tracked separately because they are persisted independently on close.
	const baselineRef = useRef<{ config: string; bindings: string } | null>(null);
	const sessionKey = open && node ? `${node.id}:${mode ?? ''}` : null;

	useEffect(() => {
		if (!open || !sessionKey || activeSessionRef.current === sessionKey) return;
		activeSessionRef.current = sessionKey;
		store.dispatch(setConnection(connection));
		store.dispatch(setFlowchart('workflow-flow'));
		const seeded = store.getState().connection.connection;
		baselineRef.current = node ? {
			config: configIdentity(extractWorkflowMethodConfig(seeded, node.id)),
			bindings: bindingsIdentity(seeded?.fieldBindings),
		} : null;
	}, [connection, node, open, sessionKey, store]);

	useEffect(() => {
		if (open || !activeSessionRef.current) return;
		activeSessionRef.current = null;
		store.dispatch(clearConnection());
	}, [open, store]);

	useEffect(() => () => { store.dispatch(clearConnection()); }, [store]);

	const persistCurrentConfig = useCallback(() => {
		if (!node || isPersistingRef.current) return;
		isPersistingRef.current = true;
		const activeElement = document.activeElement;
		if (activeElement instanceof HTMLElement) activeElement.blur();
		requestAnimationFrame(() => {
			const currentConnection = store.getState().connection.connection;
			const config = extractWorkflowMethodConfig(currentConnection, node.id);
			const bindings = currentConnection?.fieldBindings;
			const baseline = baselineRef.current;
			// The whole session leaves in one shot. Reporting the halves as they
			// happen would publish a half-applied edit — a reference's binding
			// before the body field that holds it, say — which reads downstream (the
			// dirty flag, the change history) as two unrelated edits.
			const configChanged = !!config && (!baseline || configIdentity(config) !== baseline.config);
			const bindingsChanged = !!baseline && bindingsIdentity(bindings) !== baseline.bindings;
			if (configChanged) onSave(node.id, config, bindings);
			else {
				// Nothing to save on the node, but a script edit still has to land.
				if (bindingsChanged && Array.isArray(bindings)) onFieldBindingsChange?.(bindings);
				onClose();
			}
			isPersistingRef.current = false;
		});
	}, [node, onClose, onFieldBindingsChange, onSave, store]);

	return { store, persistCurrentConfig };
}
