import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { WorkflowNodeModel } from '../../types/workflow.types';
import { describeConditionTerms } from '../../utils/graph.conditionTerms';

type Props = {
	operator: WorkflowNodeModel | undefined;
	/** The reference this dialog is about, so its own rules can be picked out of
	 *  a condition that may hold a dozen. */
	reference: string;
};

/**
 * An operator's condition, read-only, with the rules holding this reference
 * marked.
 *
 * Read-only on purpose. A condition that needs restructuring — a rule whose
 * left side stops making sense once its method is gone — is edited in the
 * operator's own editor, after the deletion, against the graph as it will
 * actually be. What this dialog owes the user before they agree to anything is
 * the answer to "where is it used", which for a method's request is a field
 * name and for a condition was, until now, nothing but the operator's own name.
 */
export function ReferenceRemapCondition({ operator, reference }: Props) {
	const { t } = useI18n('workflow');
	const terms = describeConditionTerms(operator, reference);

	if (terms.length === 0) {
		return <div className='referenceRemapConditionEmpty'>{t('referenceRemap.conditionEmpty')}</div>;
	}

	return (
		<ol className='referenceRemapCondition'>
			{terms.map((term) => (
				<li
					key={term.id}
					className={term.holdsReference
						? 'referenceRemapConditionTerm referenceRemapConditionTermHolds'
						: 'referenceRemapConditionTerm'}
				>
					{term.text}
				</li>
			))}
		</ol>
	);
}
