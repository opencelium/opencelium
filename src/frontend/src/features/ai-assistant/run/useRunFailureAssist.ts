import { useRef, useState } from 'react';
import { fetchMethodDetails, resolveTraceTarget, type LiveLogTree } from '@features/logs';
import { buildWorkflowIndexes } from '@features/workflow/api/connectionPayload.indexes';
import type { FieldBinding } from '@features/workflow/types/connection';
import type { WorkflowMethodConfig } from '@features/workflow/types/request-config.types';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '@features/workflow/types/workflow.types';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useExplainRunMutation, useFixRunMutation } from '../api/aiApi';
import type { RunExplanation, RunFix } from '../model/aiGateway.types';
import { applyFixToBindings } from './runFailureBindings';
import { workflowAssistBridgeStore } from '@features/workflow/command/workflowAssistBridge';
import { markNextChangeAsAi } from '@features/workflow/utils/aiChangeMarker';
import { notifyAiApplied } from '../ui/AiProposal/notifyAiApplied';
import { type CollectedFailure, type FixTarget, buildRunFailure, findFailedElement, isSameBody, toEditorBody, toEditorHeaders } from './runFailure.utils';

export type RunAssistState =
	| { status: 'idle' }
	| { status: 'explaining' }
	| { status: 'explained'; explanation: RunExplanation }
	| { status: 'fixing'; explanation: RunExplanation | null }
	| { status: 'fix'; explanation: RunExplanation | null; fix: RunFix; target: FixTarget }
	| { status: 'applied'; explanation: RunExplanation | null }
	| { status: 'error'; explanation: RunExplanation | null; failedAction: 'explain' | 'fix' };

export type RunAssistTarget = {
	tree: LiveLogTree;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	workflowTitle: string;
	onSaveMethodConfig: (nodeId: string, config: WorkflowMethodConfig) => void;
	/** The workflow's field bindings: references in a request are kept there too, so a fix updates both. */
	fieldBindings: FieldBinding[];
	onFieldBindingsChange: (fieldBindings: FieldBinding[]) => void;
	/** Changes with every test run; whatever was asked about an earlier run is dropped. */
	runKey: number;
};

/** The assist of one run; `explainedAt` is when the shown explanation was generated. */
type RunAssistSession = { runKey: number; state: RunAssistState; explainedAt: number | null; isHidden: boolean };

const IDLE: RunAssistState = { status: 'idle' };

/**
 * Explain and Fix with AI for a failed test run. Fix works with or without an explanation first: without one, the
 * gateway makes its own diagnosis; with one, it follows the diagnosis the user saw. The failure is collected once per run, on the first request: the
 * failing element, its full request and response (fetched like the logs panel does) and the step as configured.
 */
export function useRunFailureAssist({ tree, nodes, edges, workflowTitle, onSaveMethodConfig, fieldBindings, onFieldBindingsChange, runKey }: RunAssistTarget) {
	const { t, lang } = useI18n('workflow');
	const [explainRun] = useExplainRunMutation();
	const [fixRun] = useFixRunMutation();
	const [session, setSession] = useState<RunAssistSession>({ runKey, state: IDLE, explainedAt: null, isHidden: false });
	const collected = useRef<{ runKey: number; failure: CollectedFailure } | null>(null);
	const failed = findFailedElement(tree);
	const current = session.runKey === runKey ? session : { runKey, state: IDLE, explainedAt: null, isHidden: false };
	const { state } = current;

	// Answers arriving after the next run started belong to the old run and are dropped.
	const update = (patch: Partial<Omit<RunAssistSession, 'runKey'>>) => setSession((previous) =>
		(previous.runKey === runKey ? { ...previous, ...patch } : { runKey, state: IDLE, explainedAt: null, isHidden: false, ...patch }));
	const setState = (next: RunAssistState) => update({ state: next });

	const collect = async (): Promise<CollectedFailure | null> => {
		if (collected.current?.runKey === runKey) return collected.current.failure;
		if (!failed) return null;
		const leaf = failed.indexPath ? await resolveTraceTarget(tree, failed, tree.errorLocations) : null;
		const details = leaf?.type === 'OPERATION' ? await fetchMethodDetails(leaf.id) : null;
		const failure = buildRunFailure({ failed, details, tree, nodes, indexByNodeId: buildWorkflowIndexes(nodes, edges),
			workflowTitle, language: lang.startsWith('de') ? 'de' : 'en' });
		collected.current = { runKey, failure };
		return failure;
	};

	const explain = async () => {
		update({ state: { status: 'explaining' }, isHidden: false });
		try {
			const failure = await collect();
			if (!failure) throw new Error('No failure to explain');
			const explanation = await explainRun(failure.request).unwrap();
			update({ state: { status: 'explained', explanation: { ...explanation, isRequestFixable: explanation.isRequestFixable && !!failure.target } },
				explainedAt: Date.now() });
		} catch (error) {
			console.error(error);
			setState({ status: 'error', explanation: null, failedAction: 'explain' });
		}
	};

	const explanationOf = (value: RunAssistState) => ('explanation' in value ? value.explanation : null);

	const failedNodeId = failed?.indexPath
		? [...buildWorkflowIndexes(nodes, edges)].find(([, index]) => index === failed.indexPath)?.[0] ?? null
		: null;
	const isMethodFailure = Boolean(failedNodeId && nodes.find((node) => node.id === failedNodeId)?.data.methodConfig);
	const shownExplanation = explanationOf(state);
	// Only a failed method call has a request to change; an explanation that ruled out a request fix is respected.
	const canFix = isMethodFailure && (shownExplanation ? shownExplanation.isRequestFixable : true);

	const fix = async () => {
		const explanation = explanationOf(state);
		if (!canFix || state.status === 'fixing' || state.status === 'explaining') return;
		if (state.status === 'fix') {
			update({ isHidden: false });
			return;
		}
		update({ state: { status: 'fixing', explanation }, isHidden: false });
		try {
			const failure = await collect();
			if (!failure?.target) throw new Error('Only a failed method call can be fixed');
			const diagnosis = explanation ? { diagnosis: { cause: explanation.cause, fix: explanation.fix } } : {};
			const proposal = await fixRun({ ...failure.request, ...diagnosis }).unwrap();
			setState({ status: 'fix', explanation, fix: proposal, target: failure.target });
		} catch (error) {
			console.error(error);
			setState({ status: 'error', explanation, failedAction: 'fix' });
		}
	};

	const apply = () => {
		if (state.status !== 'fix') return;
		const { target, fix: proposal, explanation } = state;
		// The step may have been edited since the failure was collected; only its body and headers are replaced.
		const node = nodes.find((candidate) => candidate.id === target.nodeId);
		const config = node?.data.methodConfig ?? target.methodConfig;
		const isBodyChanged = !isSameBody(config.body, proposal.body);
		const body = isBodyChanged ? toEditorBody(config.body, proposal.body) : config.body;
		if (body === undefined) {
			setState({ status: 'error', explanation, failedAction: 'fix' });
			return;
		}
		const headers = toEditorHeaders(config, proposal.headers ?? []);
		markNextChangeAsAi();
		if (node?.data.color) onFieldBindingsChange(applyFixToBindings(fieldBindings, node.data.color, config, { body, headers }));
		onSaveMethodConfig(target.nodeId, { ...config, body, headers });
		setState({ status: 'applied', explanation });
		// The body, headers and bindings change in one tick, so they are one step of the editor's undo history.
		notifyAiApplied({ key: 'ai-run-applied', undoTestId: 'ai-run-undo', text: t('ai.run.applied'),
			onUndo: () => workflowAssistBridgeStore.getState().handlers.undo?.() ?? false });
	};

	const discard = () => {
		if (state.status !== 'fix') return;
		setState(state.explanation ? { status: 'explained', explanation: state.explanation } : IDLE);
	};

	return {
		state, failed, failedNodeId, canAssist: failed !== null, canFix, explainedAt: current.explainedAt,
		isShown: state.status !== 'idle' && !current.isHidden,
		hide: () => update({ isHidden: true }),
		show: () => update({ isHidden: false }),
		explain, fix, apply, discard,
	};
}

export type RunFailureAssist = ReturnType<typeof useRunFailureAssist>;
