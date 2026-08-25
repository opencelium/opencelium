import { useCallback, useEffect, useMemo, useRef } from 'react';
import { buildEditorConnection } from '../../components/request-editor/editorConnection';
import { clearConnection, setConnection, setFlowchart, updateConnection } from '../../store/connection/connectionSlice';
import { createLegacyStore } from '../../store';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import { sortValue } from '../../utils/workflowPage.utils';
import type { LensBinding } from '../bindingLens.types';

type Params = {
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings?: readonly unknown[];
	binding: LensBinding | null;
	onFieldBindingsChange: (fieldBindings: unknown[]) => void;
};

const bindingsIdentity = (fieldBindings: unknown) =>
	JSON.stringify(sortValue(fieldBindings ?? null) ?? null);

/**
 * The Enhancement editor reads its connection from the per-modal legacy store and
 * its method from MethodContext (see MethodConfigDialog, which seeds the same way
 * for the body/header editors). This hook is that seeding for one selected
 * binding, plus the write back out: only the field bindings can change here — a
 * script, a language or a description edit never touches the node's own config.
 */
export function useBindingDrawerStore({ nodes, edges, fieldBindings, binding,
	onFieldBindingsChange }: Params) {
	const store = useMemo(() => createLegacyStore(), []);
	// Built only while something is selected: the drawer stays mounted (it slides
	// out), and buildEditorConnection walks every method's request config — far
	// too much to redo on every page render for a closed drawer.
	const isActive = !!binding;
	const connection = useMemo(
		() => isActive ? buildEditorConnection(nodes, edges, fieldBindings) : null,
		[edges, fieldBindings, isActive, nodes],
	);
	const activeSessionRef = useRef<string | null>(null);
	const baselineRef = useRef<string | null>(null);
	const persistRef = useRef<() => void>(() => {});

	const persist = useCallback(() => {
		const current = store.getState().connection.connection;
		const bindings = current?.fieldBindings;
		if (!bindings || baselineRef.current === null) return;
		if (bindingsIdentity(bindings) === baselineRef.current) return;
		baselineRef.current = bindingsIdentity(bindings);
		onFieldBindingsChange(bindings as unknown[]);
	}, [onFieldBindingsChange, store]);

	// Declared before the session effect below, so the ref is already current when
	// that effect first runs.
	useEffect(() => { persistRef.current = persist; }, [persist]);

	const sessionKey = binding?.key ?? null;

	useEffect(() => {
		if (activeSessionRef.current === sessionKey) return;
		// Switching straight from one binding to another still has to publish the
		// edits made to the first before the store is reseeded under it.
		if (activeSessionRef.current) persistRef.current();
		activeSessionRef.current = sessionKey;
		if (!sessionKey || !connection) {
			baselineRef.current = null;
			store.dispatch(clearConnection());
			return;
		}
		store.dispatch(setConnection(connection));
		store.dispatch(setFlowchart('workflow-flow'));
		baselineRef.current = bindingsIdentity(
			store.getState().connection.connection?.fieldBindings);
	}, [connection, sessionKey, store]);

	// Published as it is typed, not only on the way out: the page's dirty flag and
	// the save payload both read the field bindings from there, so a script edited
	// with the drawer still open used to be missing from a Ctrl+S. persist() is a
	// no-op when nothing changed, and the writes reaching it are already debounced
	// by the editors themselves (see useEnhancementScriptValue).
	useEffect(() => {
		if (!sessionKey) return;
		return store.subscribe(() => persistRef.current());
	}, [sessionKey, store]);

	useEffect(() => () => { persistRef.current(); }, []);

	const deleteEnhancement = useCallback(() => {
		const current = store.getState().connection.connection;
		if (!current || !binding) return;
		// Same semantics as the body editor's own delete (see
		// useRequestEnhancementActions): the binding goes, the reference in the
		// field value stays and reads as a plain direct reference again.
		if (binding.source.kind !== 'enhancement') return;
		const { enhanceId } = binding.source;
		store.dispatch(updateConnection({
			fieldBindings: current.fieldBindings.filter((item) =>
				item.enhancement?.enhanceId !== enhanceId),
		}));
		persistRef.current();
	}, [binding, store]);

	return { store, persist, deleteEnhancement };
}
