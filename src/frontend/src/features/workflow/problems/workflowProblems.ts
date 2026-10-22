import type { ConnectorMetaDTO } from '@entities/connector/model/types';
import type { LensBindingGraph, LensInvalidReason } from '../lens/bindingLens.types';
import type { WorkflowNodeModel } from '../types/workflow.types';

export type WorkflowProblem =
	/** Set on the node by a rejected save or test run (see useWorkflowValidation). */
	| { kind: 'validation'; message: string }
	| { kind: 'test-run'; message: string | null }
	| { kind: 'connector'; status: 'AUTH_FAILED' | 'DOWN'; lastError: string | null }
	| { kind: 'binding'; reason: LensInvalidReason; count: number }
	/** References into a response-body field the provider does not declare. */
	| { kind: 'unknown-path'; count: number }
	| { kind: 'operator-unconfigured'; operator: 'if' | 'loop' };

export type WorkflowIssue = { nodeId: string; title: string; problems: WorkflowProblem[] };

/**
 * What a problem means for saving: an `error` blocks it, a `warning` asks first, a
 * `notice` never stands in the way — it describes the run or the system, not the
 * workflow being saved.
 */
export type WorkflowProblemSeverity = 'error' | 'warning' | 'notice';

export const getProblemSeverity = (problem: WorkflowProblem): WorkflowProblemSeverity => {
	switch (problem.kind) {
		// The backend refuses an operator without an expression anyway; catching it
		// here only saves the round trip.
		case 'operator-unconfigured': return 'error';
		// A missing method or variable cannot resolve at run time. Out of scope can
		// still be legitimate mid-edit (the provider exists, it is just not readable
		// from here yet), so it only asks.
		case 'binding': return problem.reason === 'out-of-scope' ? 'warning' : 'error';
		// The declared response is a sample, not a contract — the real one may
		// well carry the field.
		case 'unknown-path': return 'warning';
		// Leftovers of an earlier save or run; recomputed on the next attempt.
		case 'validation':
		case 'test-run':
		case 'connector':
			return 'notice';
		default: {
			const _exhaustive: never = problem;
			return _exhaustive;
		}
	}
};

/**
 * How loudly a step is flagged. Only a step whose every problem is a warning reads
 * as one; a notice still describes a real failure (a run that broke, a connector
 * that is down) even though it never stands in the way of a save.
 */
export type WorkflowIssueTone = 'danger' | 'warning';

export const getIssueTone = (issue: WorkflowIssue): WorkflowIssueTone =>
	issue.problems.every((problem) => getProblemSeverity(problem) === 'warning') ? 'warning' : 'danger';

/** Issues narrowed to the problems of one severity; issues left with none are dropped. */
export const filterIssuesBySeverity = (issues: WorkflowIssue[], severity: WorkflowProblemSeverity): WorkflowIssue[] =>
	issues.flatMap((issue) => {
		const problems = issue.problems.filter((problem) => getProblemSeverity(problem) === severity);
		return problems.length ? [{ ...issue, problems }] : [];
	});

/**
 * Drops a node error that only repeats the step's live problems. A refused save or
 * test run rings each blocked node with that node's own problem text (see
 * useSaveProblemsGate); read back, the ring would otherwise list the same problem a
 * second time, as a notice. A backend message saying something else is kept.
 */
export const dropEchoedValidation = (issues: WorkflowIssue[],
	describe: (problem: WorkflowProblem) => string): WorkflowIssue[] =>
	issues.flatMap((issue) => {
		const live = issue.problems.filter((problem) => problem.kind !== 'validation');
		const texts = live.map(describe);
		const echoes = new Set([...texts, texts.join(' '), live
			.filter((problem) => getProblemSeverity(problem) === 'error').map(describe).join(' ')]);
		const problems = issue.problems.filter((problem) =>
			problem.kind !== 'validation' || !echoes.has(problem.message));
		return problems.length ? [{ ...issue, problems }] : [];
	});

type Params = {
	nodes: WorkflowNodeModel[];
	bindingGraph: LensBindingGraph;
	/** Per consumer node, see countUnknownReferencePaths. */
	unknownPaths: ReadonlyMap<string, number>;
	/** Live health from the connector status socket, which outranks what the node was loaded with. */
	liveHealth: readonly ConnectorMetaDTO[] | undefined;
};

const connectorProblem = (node: WorkflowNodeModel, liveHealth: Params['liveHealth']): WorkflowProblem | null => {
	const connector = node.data.kind === 'connector' ? node.data.connector : undefined;
	if (!connector) return null;
	const live = liveHealth?.find((health) => health.connectorId === connector.connectorId);
	const status = live?.status ?? connector.status;
	// The same pair isConnectorConnectionError checks, spelled out so the union narrows.
	if (status !== 'AUTH_FAILED' && status !== 'DOWN') return null;
	return { kind: 'connector', status, lastError: live?.lastTestError ?? connector.lastTestError ?? null };
};

/**
 * Whether an expression still compares anything. A cleanup that removed every rule
 * leaves only the grouping behind — `()` or `!()` for an IF, a lone space for a loop.
 * Judged on the expression rather than the tree: a loaded operator can carry a valid
 * expression with no stored tree at all.
 */
const hasCondition = (expression: string | undefined) => !!expression?.replace(/[()!\s]/g, '');

const operatorProblem = (node: WorkflowNodeModel): WorkflowProblem | null => {
	const { kind } = node.data;
	if (kind !== 'if' && kind !== 'loop') return null;
	return hasCondition(node.data.conditionConfig?.expression) ? null : { kind: 'operator-unconfigured', operator: kind };
};

const bindingProblemsByNode = (graph: LensBindingGraph): Map<string, WorkflowProblem[]> => {
	const counts = new Map<string, Map<LensInvalidReason, number>>();
	graph.bindings.forEach(({ consumer, invalidReason }) => {
		if (!invalidReason || !consumer.nodeId) return;
		const byReason = counts.get(consumer.nodeId) ?? new Map<LensInvalidReason, number>();
		byReason.set(invalidReason, (byReason.get(invalidReason) ?? 0) + 1);
		counts.set(consumer.nodeId, byReason);
	});
	return new Map([...counts].map(([nodeId, byReason]) => [nodeId,
		[...byReason].map(([reason, count]): WorkflowProblem => ({ kind: 'binding', reason, count }))]));
};

/**
 * The step's name as the canvas shows it. A method's name is its subtitle (`title`
 * is the connector); an operator's subtitle is its raw condition expression — stale
 * once a cleanup rewrote the condition, unreadable either way — and the canvas only
 * ever prints "If" / "Loop", unless the user named the step.
 */
const issueTitle = (node: WorkflowNodeModel) => {
	const isOperator = node.data.kind === 'if' || node.data.kind === 'loop';
	return isOperator && !node.data.labelEdited ? node.data.title : node.data.subtitle || node.data.title;
};

/** Reading order — left to right, then top to bottom — so the arrows walk the graph the way it runs. */
const byPosition = (a: WorkflowNodeModel, b: WorkflowNodeModel) =>
	a.position.x - b.position.x || a.position.y - b.position.y;

export const collectWorkflowIssues = ({ nodes, bindingGraph, unknownPaths, liveHealth }: Params): WorkflowIssue[] => {
	const bindingProblems = bindingProblemsByNode(bindingGraph);
	return [...nodes]
		.filter((node) => node.data.kind !== 'comment' && !node.data.dropPlaceholder)
		.sort(byPosition)
		.flatMap((node): WorkflowIssue[] => {
			const problems: WorkflowProblem[] = [
				...(node.data.hasError && node.data.errorMessage
					? [{ kind: 'validation', message: node.data.errorMessage } as const] : []),
				...(node.data.testRunFailedVisible
					? [{ kind: 'test-run', message: node.data.testRunFailedMessage ?? null } as const] : []),
				...[connectorProblem(node, liveHealth), operatorProblem(node)].filter((p) => p !== null),
				...(bindingProblems.get(node.id) ?? []),
				...(unknownPaths.get(node.id) ? [{ kind: 'unknown-path', count: unknownPaths.get(node.id) ?? 0 } as const] : []),
			];
			return problems.length ? [{ nodeId: node.id, title: issueTitle(node), problems }] : [];
		});
};
