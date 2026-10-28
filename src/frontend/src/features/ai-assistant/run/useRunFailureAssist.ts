import { useRef, useState } from 'react';
import { message } from 'antd';
import { fetchMethodDetails, resolveTraceTarget, type LiveLogTree } from '@features/logs';
import { buildWorkflowIndexes } from '@features/workflow/api/connectionPayload.indexes';
import type { WorkflowMethodConfig } from '@features/workflow/types/request-config.types';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '@features/workflow/types/workflow.types';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useExplainRunMutation, useFixRunMutation } from '../api/aiApi';
import type { RunExplanation, RunFix } from '../model/aiGateway.types';
import { type CollectedFailure, type FixTarget, buildRunFailure, findFailedElement, toEditorBody } from './runFailure.utils';

export type RunAssistState =
	| { status: 'idle' }
	| { status: 'explaining' }
	| { status: 'explained'; explanation: RunExplanation }
	| { status: 'fixing'; explanation: RunExplanation }
	| { status: 'fix'; explanation: RunExplanation; fix: RunFix; target: FixTarget }
	| { status: 'applied'; explanation: RunExplanation }
	| { status: 'error'; explanation: RunExplanation | null };

export type RunAssistTarget = {
	tree: LiveLogTree;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	workflowTitle: string;
	onSaveMethodConfig: (nodeId: string, config: WorkflowMethodConfig) => void;
};

/**
 * Explain and Fix with AI for a failed test run. The failure is collected once, on the first request: the failing
 * element, its full request and response (fetched like the logs panel does) and the step as configured.
 */
export function useRunFailureAssist({ tree, nodes, edges, workflowTitle, onSaveMethodConfig }: RunAssistTarget) {
	const { t, lang } = useI18n('workflow');
	const [explainRun] = useExplainRunMutation();
	const [fixRun] = useFixRunMutation();
	const [state, setState] = useState<RunAssistState>({ status: 'idle' });
	const collected = useRef<CollectedFailure | null>(null);
	const failed = findFailedElement(tree);

	const collect = async (): Promise<CollectedFailure | null> => {
		if (collected.current || !failed) return collected.current;
		const leaf = failed.indexPath ? await resolveTraceTarget(tree, failed, tree.errorLocations) : null;
		const details = leaf?.type === 'OPERATION' ? await fetchMethodDetails(leaf.id) : null;
		collected.current = buildRunFailure({ failed, details, tree, nodes, indexByNodeId: buildWorkflowIndexes(nodes, edges),
			workflowTitle, language: lang.startsWith('de') ? 'de' : 'en' });
		return collected.current;
	};

	const explain = async () => {
		setState({ status: 'explaining' });
		try {
			const failure = await collect();
			if (!failure) throw new Error('No failure to explain');
			const explanation = await explainRun(failure.request).unwrap();
			setState({ status: 'explained', explanation: { ...explanation, isRequestFixable: explanation.isRequestFixable && !!failure.target } });
		} catch {
			setState({ status: 'error', explanation: null });
		}
	};

	const explanationOf = (current: RunAssistState) =>
		('explanation' in current ? current.explanation : null);

	const fix = async () => {
		const explanation = explanationOf(state);
		if (!explanation?.isRequestFixable || state.status === 'fixing') return;
		setState({ status: 'fixing', explanation });
		try {
			const failure = await collect();
			if (!failure?.target) throw new Error('Only a failed method call can be fixed');
			const proposal = await fixRun(failure.request).unwrap();
			setState({ status: 'fix', explanation, fix: proposal, target: failure.target });
		} catch {
			setState({ status: 'error', explanation });
		}
	};

	const apply = () => {
		if (state.status !== 'fix') return;
		const { target, fix: proposal, explanation } = state;
		// The step may have been edited since the failure was collected; only its body is replaced.
		const current = nodes.find((node) => node.id === target.nodeId)?.data.methodConfig ?? target.methodConfig;
		const body = toEditorBody(current.body, proposal.body);
		if (body === undefined) {
			setState({ status: 'error', explanation });
			return;
		}
		onSaveMethodConfig(target.nodeId, { ...current, body });
		setState({ status: 'applied', explanation });
		message.success(t('ai.run.applied'));
	};

	const discard = () => {
		if (state.status === 'fix') setState({ status: 'explained', explanation: state.explanation });
	};

	const failedNodeId = failed?.indexPath
		? [...buildWorkflowIndexes(nodes, edges)].find(([, index]) => index === failed.indexPath)?.[0] ?? null
		: null;

	return { state, failedNodeId, canAssist: failed !== null, explain, fix, apply, discard };
}
