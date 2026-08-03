import { useCallback, useEffect, useMemo, useRef } from 'react';
import { buildFromConnectorPayload } from '../../../api/connectionPayload';
import { clearConnection, setConnection, setFlowchart } from '../../../store/connection/connectionSlice';
import { createLegacyStore } from '../../../store';
import { buildLegacyConnection, extractWorkflowMethodConfig } from '../legacyAdapter';
import type { MethodConfigDialogProps } from './MethodConfigDialog.types';

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
	const sessionKey = open && node ? `${node.id}:${mode ?? ''}` : null;

	useEffect(() => {
		if (!open || !sessionKey || activeSessionRef.current === sessionKey) return;
		activeSessionRef.current = sessionKey;
		store.dispatch(setConnection(connection));
		store.dispatch(setFlowchart('workflow-flow'));
	}, [connection, open, sessionKey, store]);

	useEffect(() => {
		if (open || !activeSessionRef.current) return;
		activeSessionRef.current = null;
		store.dispatch(clearConnection());
	}, [open, store]);

	useEffect(() => () => { store.dispatch(clearConnection()); }, [store]);

	useEffect(() => {
		if (!open) return;
		const syncBindings = () => {
			const nextFieldBindings = store.getState().connection.connection?.fieldBindings;
			if (Array.isArray(nextFieldBindings)) onFieldBindingsChange?.(nextFieldBindings);
		};
		syncBindings();
		return store.subscribe(syncBindings);
	}, [onFieldBindingsChange, open, store]);

	const persistCurrentConfig = useCallback(() => {
		if (!node || isPersistingRef.current) return;
		isPersistingRef.current = true;
		const activeElement = document.activeElement;
		if (activeElement instanceof HTMLElement) activeElement.blur();
		requestAnimationFrame(() => {
			const currentConnection = store.getState().connection.connection;
			const config = extractWorkflowMethodConfig(currentConnection, node.id);
			if (config) onSave(node.id, config, currentConnection?.fieldBindings);
			else onClose();
			isPersistingRef.current = false;
		});
	}, [node, onClose, onSave, store]);

	return { store, persistCurrentConfig };
}
