import { useI18n } from '@shared/i18n/hooks/useI18n';
import { MethodColorDot } from '../MethodColorDot/MethodColorDot';
import { ReferenceMethodSelect } from '../method-select/ReferenceMethodSelect';
import type { Connection } from '../../types/connection';
import type { WorkflowNodeModel } from '../../types/workflow.types';
import type { ConditionConfig } from '../condition-builder/conditionBuilder.types';
import type { ReferenceRemapTarget } from '../../utils/graph.referenceRemapTargets';
import { restrictRemapConnection } from '../../utils/graph.referenceRemapTargets';
import { normalizeReferenceColor } from '../../utils/graph.referenceColors';
import { CLEAR, CONFIRM_POPUP_Z_INDEX } from './referenceRemap.constants';
import { ReferenceRemapSourceRow } from './ReferenceRemapSourceRow';
import type { ReferenceRemapChoice } from './referenceRemapChoice';

type Props = {
	target: ReferenceRemapTarget;
	choice: ReferenceRemapChoice;
	/** The graph as it will be, in the generator's own shape. Each field row
	 *  narrows it to what that field may be read from. */
	connection: Connection;
	/** The graph as it still is, where the method being deleted can still be
	 *  named — what the reference being replaced is drawn from. */
	previousConnection: Connection;
	/** Operators by id, for reading a condition a reference sits in. */
	operators: Map<string, WorkflowNodeModel>;
	/** Conditions already rewritten in this dialog, so a row shows what will be
	 *  saved rather than what is still on the graph. */
	rewrittenConditions: Record<string, ConditionConfig>;
	onEditCondition: (nodeId: string) => void;
	onChange: (choice: ReferenceRemapChoice) => void;
};

export function ReferenceRemapRow({ target, choice, connection, previousConnection,
	operators, rewrittenConditions, onEditCondition, onChange }: Props) {
	const { t } = useI18n('workflow');
	const hasCandidates = target.candidates.length > 0;
	// The row answers in colours; a method picker speaks ids. The candidates are
	// the translation between the two, and the methods themselves come from the
	// connection so the picker can draw each one the way it always does.
	const replacementMethodId = target.candidates
		.find((candidate) => candidate.color === choice.replacement)?.nodeId;
	// The method being deleted, still on the graph the dialog was opened from.
	const doomedMethod = previousConnection.fromConnector.method
		.find((method) => normalizeReferenceColor(method.color) === target.color);
	const candidateIds = new Set(target.candidates.map((candidate) => candidate.nodeId));
	const candidateMethods = connection.fromConnector.method
		.filter((method) => candidateIds.has(method.id));
	const answer = (methodId: string) => target.candidates
		.find((candidate) => candidate.nodeId === methodId)?.color ?? CLEAR;

	return (
		<div className='referenceRemapRow'>
			<div className='referenceRemapSubject'>
				<MethodColorDot color={target.color} size={8} />
				<span className='referenceRemapName' title={target.label}>{target.label}</span>
				<span className='referenceRemapReadBy'>
					{t('referenceRemap.readBy', { count: target.consumerNodeIds.length })}
				</span>
			</div>
			{hasCandidates ? (
				/* The whole method in one answer, which is the common case: the fields
				   keep their paths and are read from somewhere else. Anything the new
				   method cannot serve is then corrected field by field below. */
				<ReferenceMethodSelect
					methods={candidateMethods}
					methodId={replacementMethodId ?? CLEAR}
					selectedMethod={candidateMethods
						.find((method) => method.id === replacementMethodId)}
					leadingOption={{ value: CLEAR, label: t('referenceRemap.clear') }}
					popupZIndex={CONFIRM_POPUP_Z_INDEX}
					onChange={(methodId) => onChange({ ...choice, replacement: answer(methodId) })}
					// onSelect as well as onChange, so re-picking the method already
					// chosen still starts the field rows below over: the user answered
					// the question again, whether or not the answer moved.
					onSelect={(methodId) => onChange({ ...choice, replacement: answer(methodId),
						seedVersion: choice.seedVersion + 1 })}
					testId={`workflow-reference-remap-${target.color.replace('#', '')}`}
				/>
			) : (
				<div className='referenceRemapEmpty'>{t('referenceRemap.noCandidates')}</div>
			)}
			{target.sources.length > 0 && (
				<div className='referenceRemapSources'>
					<div className='referenceRemapSourcesHint'>{t('referenceRemap.perFieldHint')}</div>
					{/* A table, because that is what these rows are: one field of the
					    deleted method per row, and what it should read instead. */}
					<table className='referenceRemapTable'>
						<thead>
							<tr>
								<th>{t('referenceRemap.columnCurrent')}</th>
								<th>{t('referenceRemap.columnHeld')}</th>
								<th>{t('referenceRemap.columnNew')}</th>
							</tr>
						</thead>
						<tbody>
							{target.sources.map((source) => (
								<ReferenceRemapSourceRow
									key={source.key}
									source={source}
									connection={connection}
									operators={operators}
									rewrittenConditions={rewrittenConditions}
									onEditCondition={onEditCondition}
									// Read-only, and drawn from the graph as it still is: the
									// method this reference names is the one being deleted, and
									// is already gone from the graph the row's other controls
									// are built from.
									current={doomedMethod ? restrictRemapConnection(previousConnection,
										[{ nodeId: doomedMethod.id, color: target.color,
											label: target.label }], source.consumerNodeIds) : null}
									// Its own scope, not the method's: this field is only read
									// by some of the steps that read the method above it.
									generator={restrictRemapConnection(connection, source.candidates,
										source.consumerNodeIds)}
									reference={choice.fields[source.key]}
									defaultMethodId={replacementMethodId}
									resetKey={choice.seedVersion}
									onChange={(reference) => {
										const fields = { ...choice.fields };
										if (reference) fields[source.key] = reference;
										else delete fields[source.key];
										onChange({ ...choice, fields });
									}}
								/>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
