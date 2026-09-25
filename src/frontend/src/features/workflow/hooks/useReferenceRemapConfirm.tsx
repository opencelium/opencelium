import { useCallback } from 'react';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { ReferenceRemapChoices } from '../components/reference-remap/ReferenceRemapChoices';
import type { ReferenceRemapPlan } from '../utils/graph.referenceRemap';
import { EMPTY_REMAP_PLAN } from '../utils/graph.referenceRemap';
import type { ReferenceRemapTarget } from '../utils/graph.referenceRemapTargets';
import { REMAP_DIALOG_WIDTH } from '../components/reference-remap/referenceRemap.constants';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';

export type ReferenceRemapAnswer = {
	confirmed: boolean;
	/** Where each doomed reference should point instead. Empty means "clear
	 *  them", which is what the delete did before there was anything else to
	 *  offer. */
	plan: ReferenceRemapPlan;
};

/**
 * The delete confirmation, asked as a question about the references rather than
 * only about the step: what the steps reading it should read instead.
 *
 * Inside the existing confirm rather than a dialog of its own — the choice
 * belongs to the same decision, and a second dialog would have to re-implement
 * the buttons, focus and escape handling this one already has. The confirm owns
 * the buttons, so the content reports each change into a map the caller reads
 * once the promise resolves; nothing is applied until the user confirms.
 */
export const useReferenceRemapConfirm = () => {
	const confirm = useConfirm();
	const { t } = useI18n('workflow');

	return useCallback(async (
		targets: ReferenceRemapTarget[],
		graphs: {
			before: { nodes: WorkflowNodeModel[]; edges: WorkflowEdgeModel[] };
			after: { nodes: WorkflowNodeModel[]; edges: WorkflowEdgeModel[] };
		},
	): Promise<ReferenceRemapAnswer> => {
		let plan: ReferenceRemapPlan = EMPTY_REMAP_PLAN;
		const confirmed = await confirm({
			title: t('confirmDelete.title'),
			// Wide only when it has to be: a confirm with nothing but a sentence in
			// it should stay the size every other confirm is.
			width: targets.length === 0 ? undefined : REMAP_DIALOG_WIDTH,
			message: targets.length === 0 ? t('confirmDelete.message') : (
				<>
					{t('confirmDelete.message')}
					<ReferenceRemapChoices
						targets={targets}
						after={graphs.after}
						before={graphs.before}
						onChange={(next) => {
							plan = next;
						}}
					/>
				</>
			),
			confirmText: t('actions.delete'),
			cancelText: t('actions.cancel'),
			confirmVariant: 'solid',
		});
		return { confirmed, plan };
	}, [confirm, t]);
};
