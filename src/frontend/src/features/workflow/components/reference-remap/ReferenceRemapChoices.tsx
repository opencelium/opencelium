import { useMemo, useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { ConditionBuilderDialog } from '../condition-builder/ConditionBuilder';
import type { ConditionConfig } from '../condition-builder/conditionBuilder.types';
import type { ReferenceRemapPlan } from '../../utils/graph.referenceRemap';
import type { ReferenceRemapTarget } from '../../utils/graph.referenceRemapTargets';
import { buildRemapConnection } from '../../utils/graph.referenceRemapTargets';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import { ReferenceRemapRow } from './ReferenceRemapRow';
import type { ReferenceRemapChoice } from './referenceRemapChoice';
import { buildRemapPlan, emptyChoice } from './referenceRemapChoice';
import { CONFIRM_POPUP_Z_INDEX } from './referenceRemap.constants';

type Props = {
	targets: ReferenceRemapTarget[];
	/** The graph as it will be once the deletion goes through — what the field
	 *  pickers must offer references from. */
	after: { nodes: WorkflowNodeModel[]; edges: WorkflowEdgeModel[] };
	/** And as it still is: the only place the method being deleted can be named,
	 *  which the reference being replaced has to do. */
	before: { nodes: WorkflowNodeModel[]; edges: WorkflowEdgeModel[] };
	/** Reported on each change rather than read on submit: the confirm dialog
	 *  owns the buttons, so this content has no submit of its own. */
	onChange: (plan: ReferenceRemapPlan) => void;
};

export function ReferenceRemapChoices({ targets, after, before, onChange }: Props) {
	const { t } = useI18n('workflow');
	const [choices, setChoices] = useState<Record<string, ReferenceRemapChoice>>({});
	// Conditions rewritten by hand, held here until the deletion is confirmed —
	// the operator's editor writes into this, not into the graph, so Cancel
	// really does cancel.
	const [conditions, setConditions] = useState<Record<string, ConditionConfig>>({});
	const [editingOperatorId, setEditingOperatorId] = useState<string>();
	// One legacy connection for the whole dialog: building it deserializes every
	// method's request config, and each field row only needs it cut down, which
	// is cheap.
	const connection = useMemo(() => buildRemapConnection(after), [after]);
	const previousConnection = useMemo(() => buildRemapConnection(before), [before]);
	// Conditions are read off the nodes themselves: an operator is not a method
	// and has nothing in the legacy connection to read them from.
	const operators = useMemo(() => new Map(after.nodes
		.filter((node) => node.type === 'if' || node.type === 'loop')
		.map((node) => [node.id, node])), [after.nodes]);

	const update = (color: string, choice: ReferenceRemapChoice) => {
		const next = { ...choices, [color]: choice };
		setChoices(next);
		onChange(buildRemapPlan(targets, next, conditions));
	};

	const rewriteCondition = (nodeId: string, config: ConditionConfig) => {
		const next = { ...conditions, [nodeId]: config };
		setConditions(next);
		setEditingOperatorId(undefined);
		onChange(buildRemapPlan(targets, choices, next));
	};

	// What the editor opens on: the staged rewrite where there is one, so
	// reopening continues from the last edit rather than from the graph.
	const editingOperator = editingOperatorId ? operators.get(editingOperatorId) : undefined;
	const editingNode = editingOperator && conditions[editingOperator.id]
		? { ...editingOperator,
			data: { ...editingOperator.data, conditionConfig: conditions[editingOperator.id] } }
		: editingOperator;

	return (
		<div className='referenceRemap' data-testid='workflow-reference-remap'>
			<div className='referenceRemapIntro'>{t('referenceRemap.intro')}</div>
			{targets.map((target) => (
				<ReferenceRemapRow
					key={target.color}
					target={target}
					choice={choices[target.color] ?? emptyChoice()}
					connection={connection}
					previousConnection={previousConnection}
					onEditCondition={setEditingOperatorId}
					onChange={(choice) => update(target.color, choice)}
				/>
			))}
			{/* The operator's own editor, opened on a copy and answering into this
			    dialog's plan. Its pickers read the graph as it will be, so it cannot
			    offer the method being deleted — the trap this dialog exists to
			    avoid, and the one thing an editor opened as-is would walk into. */}
			<ConditionBuilderDialog
				open={!!editingNode}
				node={editingNode ?? null}
				nodes={after.nodes}
				edges={after.edges}
				connection={connection}
				zIndex={CONFIRM_POPUP_Z_INDEX}
				onClose={() => setEditingOperatorId(undefined)}
				onSave={rewriteCondition}
			/>
		</div>
	);
}
