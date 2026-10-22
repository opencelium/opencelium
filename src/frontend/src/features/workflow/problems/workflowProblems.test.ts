import { describe, expect, it } from 'vitest';
import { dropEchoedValidation, filterIssuesBySeverity, getIssueTone, getProblemSeverity, type WorkflowIssue } from './workflowProblems';

describe('getProblemSeverity', () => {
	it('blocks on what cannot run, asks on what may not, ignores run and system state', () => {
		expect(getProblemSeverity({ kind: 'operator-unconfigured', operator: 'if' })).toBe('error');
		expect(getProblemSeverity({ kind: 'binding', reason: 'missing-method', count: 1 })).toBe('error');
		expect(getProblemSeverity({ kind: 'binding', reason: 'missing-variable', count: 1 })).toBe('error');
		expect(getProblemSeverity({ kind: 'binding', reason: 'out-of-scope', count: 1 })).toBe('warning');
		expect(getProblemSeverity({ kind: 'unknown-path', count: 1 })).toBe('warning');
		expect(getProblemSeverity({ kind: 'validation', message: 'Rejected' })).toBe('notice');
		expect(getProblemSeverity({ kind: 'test-run', message: null })).toBe('notice');
		expect(getProblemSeverity({ kind: 'connector', status: 'DOWN', lastError: null })).toBe('notice');
	});
});

describe('filterIssuesBySeverity', () => {
	const issues: WorkflowIssue[] = [
		{ nodeId: 'a', title: 'A', problems: [
			{ kind: 'binding', reason: 'missing-method', count: 1 },
			{ kind: 'binding', reason: 'out-of-scope', count: 2 },
		] },
		{ nodeId: 'b', title: 'B', problems: [{ kind: 'connector', status: 'DOWN', lastError: null }] },
	];

	it('keeps only the problems of that severity and drops issues left empty', () => {
		expect(filterIssuesBySeverity(issues, 'error')).toEqual([
			{ nodeId: 'a', title: 'A', problems: [{ kind: 'binding', reason: 'missing-method', count: 1 }] },
		]);
		expect(filterIssuesBySeverity(issues, 'warning').map((issue) => issue.problems))
			.toEqual([[{ kind: 'binding', reason: 'out-of-scope', count: 2 }]]);
		expect(filterIssuesBySeverity(issues, 'notice').map((issue) => issue.nodeId)).toEqual(['b']);
	});
});

describe('getIssueTone', () => {
	const issue = (problems: WorkflowIssue['problems']): WorkflowIssue => ({ nodeId: 'n', title: 'N', problems });

	it('reads as a warning only when every problem is one', () => {
		expect(getIssueTone(issue([{ kind: 'unknown-path', count: 1 },
			{ kind: 'binding', reason: 'out-of-scope', count: 1 }]))).toBe('warning');
		expect(getIssueTone(issue([{ kind: 'unknown-path', count: 1 },
			{ kind: 'operator-unconfigured', operator: 'if' }]))).toBe('danger');
	});

	// A failed run or a connector that is down is a real failure, whatever it means for saving.
	it('keeps notices loud', () => {
		expect(getIssueTone(issue([{ kind: 'test-run', message: null }]))).toBe('danger');
		expect(getIssueTone(issue([{ kind: 'connector', status: 'DOWN', lastError: null }]))).toBe('danger');
	});
});

describe('dropEchoedValidation', () => {
	const describe = (problem: WorkflowIssue['problems'][number]) =>
		problem.kind === 'validation' ? problem.message : problem.kind;

	it('drops the ring a refused save left with the step\'s own problem text', () => {
		expect(dropEchoedValidation([{ nodeId: 'if', title: 'If', problems: [
			{ kind: 'validation', message: 'operator-unconfigured' },
			{ kind: 'operator-unconfigured', operator: 'if' },
		] }], describe)).toEqual([
			{ nodeId: 'if', title: 'If', problems: [{ kind: 'operator-unconfigured', operator: 'if' }] },
		]);
	});

	it('matches the joined text the gate writes for several errors, warnings aside', () => {
		const [issue] = dropEchoedValidation([{ nodeId: 'm', title: 'M', problems: [
			{ kind: 'validation', message: 'operator-unconfigured binding' },
			{ kind: 'operator-unconfigured', operator: 'if' },
			{ kind: 'binding', reason: 'missing-method', count: 1 },
			{ kind: 'unknown-path', count: 1 },
		] }], describe);
		expect(issue.problems.map((problem) => problem.kind)).not.toContain('validation');
	});

	it('keeps a backend message that says something else', () => {
		const problems: WorkflowIssue['problems'] = [
			{ kind: 'validation', message: 'Rejected by the server' },
			{ kind: 'operator-unconfigured', operator: 'if' },
		];
		expect(dropEchoedValidation([{ nodeId: 'if', title: 'If', problems }], describe)[0].problems).toEqual(problems);
	});
});
