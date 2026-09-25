import type { ConditionChild, ConditionConfig } from '../components/condition-builder/conditionBuilder.types';
import type { WorkflowUndoChange, WorkflowUndoOperatorKind } from '../types/undoHistory.types';
import { sortValue } from './workflowPage.utils';

const stable = (value: unknown) => JSON.stringify(sortValue(value) ?? null);

/**
 * The rules and groups a condition tree contains, each mapped to the stable
 * identity of its own properties — so "a rule changed" can be told apart from
 * "a rule was added", and a group edit (its conjunction, its NOT) from an edit
 * to something nested inside it.
 *
 * The root group is skipped: it always exists, so counting it would make the
 * first rule added to an empty condition look like a new group too.
 */
const inventory = (config?: ConditionConfig) => {
	const rules = new Map<string, string>();
	const groups = new Map<string, string>();
	// Owning group per rule, so a rule that arrived or left *inside* an added or
	// removed group can be recognised as part of that one action.
	const ruleOwner = new Map<string, string>();
	const visit = (child: ConditionChild, owner: string) => {
		if (child.type === 'rule') {
			rules.set(child.id, stable(child.properties ?? null));
			ruleOwner.set(child.id, owner);
			return;
		}
		if (child.id !== config?.tree?.id) groups.set(child.id, stable(child.properties ?? null));
		(child.items ?? []).forEach((item) => visit(item, child.id));
	};
	if (config?.tree) visit(config.tree, config.tree.id);
	// The root group is excluded from `groups` on purpose (it always exists), but
	// its own conjunction and NOT are still editable — and they belong to the
	// condition itself rather than to any group the user created.
	return { rules, groups, ruleOwner, root: stable(config?.tree?.properties ?? null) };
};

const addedKeys = (before: Map<string, string>, after: Map<string, string>) =>
	[...after.keys()].filter((id) => !before.has(id));
const removedKeys = (before: Map<string, string>, after: Map<string, string>) =>
	[...before.keys()].filter((id) => !after.has(id));

type Delta = 'added' | 'removed' | 'edited' | null;

const deltaOf = (before: Map<string, string>, after: Map<string, string>): Delta => {
	const added = [...after.keys()].filter((id) => !before.has(id)).length;
	const removed = [...before.keys()].filter((id) => !after.has(id)).length;
	if (added && !removed) return 'added';
	if (removed && !added) return 'removed';
	// One swapped for another, or same set with different properties.
	if (added && removed) return 'edited';
	return [...after.keys()].some((id) => before.get(id) !== after.get(id)) ? 'edited' : null;
};

/**
 * Narrows an operator's condition edit to the rule or the group it happened to,
 * naming the operator (IF or LOOP) it belongs to. Falls back to the generic
 * `condition-config` for changes that are neither — a LOOP's iterator, or a
 * re-serialised expression.
 */
export const describeConditionChange = (
	before: ConditionConfig | undefined,
	after: ConditionConfig | undefined,
	operator: WorkflowUndoOperatorKind,
	name?: string,
): WorkflowUndoChange => {
	const previous = inventory(before);
	const next = inventory(after);
	const groupDelta = deltaOf(previous.groups, next.groups);

	// Rules that came or went with a group are part of that one action, so they
	// are dropped before judging whether the rules changed independently.
	const addedGroups = new Set(addedKeys(previous.groups, next.groups));
	const removedGroups = new Set(removedKeys(previous.groups, next.groups));
	const survivingRules = (source: typeof previous, skip: Set<string>) =>
		new Map([...source.rules].filter(([id]) => !skip.has(source.ruleOwner.get(id) ?? '')));
	const ruleDelta = deltaOf(
		survivingRules(previous, removedGroups),
		survivingRules(next, addedGroups),
	);
	const otherChanged = stable(before?.iterator ?? null) !== stable(after?.iterator ?? null);
	// Deliberately outside the signal count below: adding the first rule to an
	// empty condition can also initialise the root's conjunction, and that must
	// not turn "Added Condition" into the vaguer "Edited IF".
	const rootChanged = previous.root !== next.root;

	// More than one independent thing moved — name the operator rather than pick
	// one of them.
	if ([groupDelta !== null, ruleDelta !== null, otherChanged]
		.filter(Boolean).length > 1) {
		return { kind: 'operator-edited', operator };
	}

	// Adding a group may seed it with a rule, and deleting one takes its rules
	// with it — either way the group is the unit the user acted on.
	if (groupDelta === 'added' || groupDelta === 'removed') {
		return { kind: 'condition-group', operator, operation: groupDelta };
	}
	if (ruleDelta === 'added' || ruleDelta === 'removed') {
		return { kind: 'condition-rule', operator, operation: ruleDelta };
	}
	if (groupDelta) return { kind: 'condition-group', operator, operation: 'edited' };
	if (ruleDelta) return { kind: 'condition-rule', operator, operation: 'edited' };
	// The top-level conjunction (or NOT) moved and nothing else did — that is an
	// edit to the condition, not to a group inside it.
	if (rootChanged) return { kind: 'condition-rule', operator, operation: 'edited' };
	return { kind: 'condition-config', name };
};
