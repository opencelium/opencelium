import { useCallback, useEffect, useMemo, useRef } from 'react';
import { clearConnection, setConnection, setFlowchart } from '../../../store/connection/connectionSlice';
import { createLegacyStore } from '../../../store';
import { buildEditorConnection } from '../editorConnection';
import { extractWorkflowMethodConfig } from '../legacyAdapter';
import { sortValue } from '../../../utils/workflowPage.utils';
import { toAuthoredMethodConfig } from '../../../utils/requestConfig';
import type { WorkflowMethodConfig } from '../../../types/request-config.types';
import type { MethodConfigDialogProps, MethodDraft } from './MethodConfigDialog.types';
import { createAiDialogSteps } from '../../../utils/aiDialogSteps';
import type { RecordAiStep } from '../../../providers/AiDialogStepsContext';

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

const draftIdentity = (draft: MethodDraft) => `${configIdentity(draft.config)}|${bindingsIdentity(draft.fieldBindings)}`;

export function useMethodConfigDialogState({ open, node, mode, nodes, edges,
	fieldBindings, onFieldBindingsChange, onClose, onSave, onRecordAiSteps }: MethodConfigDialogProps) {
	const store = useMemo(() => createLegacyStore(), []);
	const aiSteps = useMemo(() => createAiDialogSteps<MethodDraft>(draftIdentity), []);
	const nodeId = node?.id;
	const readDraft = useCallback((): MethodDraft => {
		const current = store.getState().connection.connection;
		return { config: nodeId ? extractWorkflowMethodConfig(current, nodeId) : null,
			fieldBindings: current?.fieldBindings as unknown[] | undefined };
	}, [nodeId, store]);
	const recordAiStep = useCallback<RecordAiStep>((apply) => {
		const before = readDraft();
		apply();
		return aiSteps.record(before, readDraft());
	}, [aiSteps, readDraft]);
	const connection = useMemo(() => buildEditorConnection(nodes, edges ?? [], fieldBindings),
		[edges, fieldBindings, nodes]);
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
		aiSteps.start(readDraft());
		baselineRef.current = node ? {
			config: configIdentity(extractWorkflowMethodConfig(seeded, node.id)),
			bindings: bindingsIdentity(seeded?.fieldBindings),
		} : null;
	}, [aiSteps, connection, node, open, readDraft, sessionKey, store]);

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
			const steps = aiSteps.take();
			if (steps.length) onRecordAiSteps?.(node.id, steps);
			if (configChanged) onSave(node.id, config, bindings);
			else {
				// Nothing to save on the node, but a script edit still has to land.
				if (bindingsChanged && Array.isArray(bindings)) onFieldBindingsChange?.(bindings);
				onClose();
			}
			isPersistingRef.current = false;
		});
	}, [aiSteps, node, onClose, onFieldBindingsChange, onRecordAiSteps, onSave, store]);

	return { store, persistCurrentConfig, recordAiStep };
}
