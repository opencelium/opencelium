import { useState } from 'react';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { LegacyBodyReferenceGenerator }
	from '../request-editor/body-editor/LegacyBodyReferenceGenerator/LegacyBodyReferenceGenerator';
import type { Connection, MethodWithId } from '../../types/connection';
import type { WorkflowNodeModel } from '../../types/workflow.types';
import type { ReferenceRemapSource } from '../../utils/graph.referenceRemapTargets';
import type { ConditionConfig } from '../condition-builder/conditionBuilder.types';
import { ReferenceRemapCondition } from './ReferenceRemapCondition';
import { CONFIRM_POPUP_Z_INDEX } from './referenceRemap.constants';

type Props = {
	source: ReferenceRemapSource;
	/** The reference being replaced, in the shape that draws it: the method it
	 *  names is the one being deleted, so it comes from the graph as it still
	 *  is. Absent when that method cannot be named there. */
	current: { connection: Connection; consumerMethod: MethodWithId } | null;
	/** The graph as it will be, for drawing the field this reference fills —
	 *  that step survives the deletion. */
	connection: Connection;
	/** Operators by id, for reading the condition a reference sits in. */
	operators: Map<string, WorkflowNodeModel>;
	/** Conditions already rewritten in this dialog — what the preview shows, so
	 *  it reflects the answer rather than the graph. */
	rewrittenConditions: Record<string, ConditionConfig>;
	onEditCondition: (nodeId: string) => void;
	/** Restricted to what every step holding *this* reference can see; the
	 *  generator narrows further by its own upstream walk and can only narrow.
	 *  Absent when nothing is readable from there, so the field can only be
	 *  cleared. */
	generator: { connection: Connection; consumerMethod: MethodWithId } | null;
	/** The whole reference this field will become, once it has been answered. */
	reference?: string;
	/** The method the row as a whole was pointed at, so a field only has to
	 *  answer what is left — which field of it to read. */
	defaultMethodId?: string;
	/** Bumped every time the row above is answered, so this generator starts
	 *  over even when that answer did not change value. */
	resetKey?: number;
	onChange: (reference: string | undefined) => void;
};

export function ReferenceRemapSourceRow({ source, current, connection, operators,
	rewrittenConditions, onEditCondition, generator, reference, defaultMethodId, resetKey,
	onChange }: Props) {
	const { t } = useI18n('workflow');
	const [isConditionOpen, setIsConditionOpen] = useState(false);
	/** The operator as it will be saved: the rewrite where there is one. */
	const rewrittenOperator = (nodeId: string) => {
		const operator = operators.get(nodeId);
		const rewritten = rewrittenConditions[nodeId];
		return operator && rewritten
			? { ...operator, data: { ...operator.data, conditionConfig: rewritten } }
			: operator;
	};
	// One reference can be held in several places; the first is shown and the
	// rest counted, because re-pointing it moves all of them together and there
	// is nothing to answer per place.
	const [held, ...alsoHeld] = source.locations;

	return (
		<>
		<tr className='referenceRemapSource'>
			{/* The reference being replaced, drawn the way references are authored
			    rather than written out as a string — the same controls as the column
			    beside it, so the two read as the same kind of thing and line up
			    field for field. Disabled throughout: it is the question, not an
			    answer. The string stays as the hover hint, since a control cannot
			    show a long path in full either. */}
			<td className='referenceRemapSourceCurrent' title={source.key}>
				{current ? (
					<LegacyBodyReferenceGenerator
						connection={current.connection}
						currentMethod={current.consumerMethod}
						showWebhookOption={false}
						popupZIndex={CONFIRM_POPUP_Z_INDEX}
						value={source.key}
						readOnly
						showMethod={false}
						responsePartAsText
						onApply={() => undefined}
					/>
				) : (
					<span className='referenceRemapSourcePath'>{source.key}</span>
				)}
			</td>
			{/* Where the reference sits: the field of the reading step it fills,
			    drawn as the reference that field *is* — same controls, disabled —
			    or named where a value spliced into a URL or an operator condition
			    has no field to name. */}
			<td className='referenceRemapSourceHeld'
				title={source.locations.map((location) => location.value).join(', ')}>
				{held?.kind === 'reference' ? (
					<LegacyBodyReferenceGenerator
						connection={connection}
						currentMethod={current?.consumerMethod ?? generator?.consumerMethod
							?? ({} as MethodWithId)}
						showWebhookOption={false}
						popupZIndex={CONFIRM_POPUP_Z_INDEX}
						value={held.value}
						readOnly
						responsePartAsText
						onApply={() => undefined}
					/>
				) : (
					<span className='referenceRemapSourcePath'>{held?.value ?? ''}</span>
				)}
				{/* A condition can hold this reference in any number of its rules, and
				    the operator's name is the same answer for all of them — so the
				    rules themselves are one click away. */}
				{held?.kind === 'operator' && (
					<Tooltip content={t(isConditionOpen
						? 'referenceRemap.hideCondition' : 'referenceRemap.showCondition')}>
						<IconButton
							iconProps={{ name: isConditionOpen ? 'eye-off' : 'eye' }}
							size='xs'
							type='text'
							onClick={() => setIsConditionOpen(!isConditionOpen)}
							testId={`workflow-reference-remap-condition-${source.key}`}
						/>
					</Tooltip>
				)}
				{/* Some conditions cannot be answered by re-pointing at all — a rule
				    whose left side stops meaning anything once its method is gone has
				    to be rewritten. The operator's own editor does that here, on a
				    copy: nothing reaches the graph until Delete. */}
				{held?.kind === 'operator' && (
					<Tooltip content={t('referenceRemap.editCondition')}>
						<IconButton
							iconProps={{ name: 'edit' }}
							size='xs'
							type='text'
							onClick={() => onEditCondition(held.nodeId)}
							testId={`workflow-reference-remap-edit-condition-${source.key}`}
						/>
					</Tooltip>
				)}
				{alsoHeld.length > 0 && (
					<span className='referenceRemapSourceMore'>
						{t('referenceRemap.alsoHeld', { count: alsoHeld.length })}
					</span>
				)}
			</td>
			<td className='referenceRemapSourceValue'>
				{generator ? (
					<>
						{/* The editor's own reference control, so this field is re-pointed
						    the way every other reference in the workflow is authored: a
						    method, a response part — body, header or status — and a path
						    within it. It stays on screen once answered, showing that
						    answer in its own controls: the answer is a reference, and a
						    reference is what this control is for — swapping it for the
						    text of the result took away the means to adjust it. */}
						<LegacyBodyReferenceGenerator
							connection={generator.connection}
							currentMethod={generator.consumerMethod}
							showWebhookOption={false}
							popupZIndex={CONFIRM_POPUP_Z_INDEX}
							defaultMethodId={defaultMethodId}
							resetKey={resetKey}
							applyOnSelect
							value={reference}
							onApply={onChange}
						/>
						{reference && (
							<Tooltip content={t('referenceRemap.resetField')}>
								<IconButton
									iconProps={{ name: 'close' }}
									size='xs'
									type='text'
									onClick={() => onChange(undefined)}
									testId={`workflow-reference-remap-reset-${source.key}`}
								/>
							</Tooltip>
						)}
					</>
				) : (
					<span className='referenceRemapEmpty'>{t('referenceRemap.noCandidates')}</span>
				)}
			</td>
		</tr>
		{isConditionOpen && held?.kind === 'operator' && (
			<tr className='referenceRemapConditionRow'>
				<td colSpan={3}>
					<ReferenceRemapCondition
						operator={rewrittenOperator(held.nodeId)}
						reference={source.key}
					/>
				</td>
			</tr>
		)}
		</>
	);
}
