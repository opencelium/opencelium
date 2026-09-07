import { Button } from '@shared/ui/primitives/Button';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { LegacyBodyReferenceGenerator }
	from '../request-editor/body-editor/LegacyBodyReferenceGenerator/LegacyBodyReferenceGenerator';
import type { Connection, MethodWithId } from '../../types/connection';
import type { ReferenceRemapSource } from '../../utils/graph.referenceRemapTargets';
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

export function ReferenceRemapSourceRow({ source, current, connection,
	onEditCondition, generator, reference, defaultMethodId, resetKey,
	onChange }: Props) {
	const { t } = useI18n('workflow');
	// One reference can be held in several places; the first is shown and the
	// rest counted, because re-pointing it moves all of them together and there
	// is nothing to answer per place.
	const [held, ...alsoHeld] = source.locations;

	return (
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
				{/* The flex box lives on this inner div, never on the <td> itself: a
				    table cell with its own `display: flex` stops being a table cell in
				    real layout — it blockifies and drops out of the row, dragging the
				    next <td> down onto a line of its own. Wrapping keeps the cell a
				    normal table-cell and confines the flex row to its content. */}
				<div className='referenceRemapSourceHeldRow'>
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
					{alsoHeld.length > 0 && (
						<span className='referenceRemapSourceMore'>
							{t('referenceRemap.alsoHeld', { count: alsoHeld.length })}
						</span>
					)}
				</div>
			</td>
			<td className='referenceRemapSourceValue'>
				<div className='referenceRemapSourceValueRow'>
					{held?.kind === 'operator' ? (
						/* Not a field, so there is nothing to re-point it at — a rule whose
						   left side stops meaning anything once its method is gone has to be
						   rewritten instead. This is the row's actual answer for that case,
						   in the same column every other row answers from, rather than an
						   icon parked next to "where is it used" and a message explaining
						   why nothing is offered here. */
						<Button
							variant='secondary'
							iconLeft='edit'
							onClick={() => onEditCondition(held.nodeId)}
							testId={`workflow-reference-remap-edit-condition-${source.key}`}
						>
							{t('referenceRemap.editCondition')}
						</Button>
					) : generator ? (
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
				</div>
			</td>
		</tr>
	);
}
