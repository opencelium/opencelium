import { Select } from '@shared/ui/primitives/Select';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { MethodColorDot } from '../MethodColorDot/MethodColorDot';
import { LegacyResponseFieldSelect } from '../request-editor/body-editor/LegacyResponseFieldSelect/LegacyResponseFieldSelect';
import type { ResponseType } from '../request-editor/body-editor/requestReferenceOptions';
import type { ReferenceRemapTarget } from '../../utils/graph.referenceRemapTargets';

/* The confirm dialog hosting this row is at 20000 (ConfirmDialogProvider), and
   the field picker's popup is rendered on document.body — so it has to be told
   to stack above it or it opens behind the dialog it was opened from. */
const CONFIRM_POPUP_Z_INDEX = 20010;

/** The value standing for "no replacement" — the old behaviour, and the default:
 *  a deletion must never quietly re-point someone's reference at a method they
 *  did not choose. */
export const CLEAR = '';

type Props = {
	target: ReferenceRemapTarget;
	replacement: string;
	/** Source reference key → the path chosen on the replacement method. Absent
	 *  means the field keeps the path it reads today. */
	paths: Record<string, string>;
	onReplacementChange: (color: string) => void;
	onPathChange: (sourceKey: string, path: string) => void;
};

export function ReferenceRemapRow({ target, replacement, paths,
	onReplacementChange, onPathChange }: Props) {
	const { t } = useI18n('workflow');
	const chosen = target.candidates.find((candidate) => candidate.color === replacement);

	return (
		<div className='referenceRemapRow'>
			<div className='referenceRemapSubject'>
				<MethodColorDot color={target.color} size={8} />
				<span className='referenceRemapName'>{target.label}</span>
				<span className='referenceRemapReadBy'>
					{t('referenceRemap.readBy', { count: target.consumerNodeIds.length })}
				</span>
			</div>
			{target.candidates.length === 0 ? (
				<div className='referenceRemapEmpty'>{t('referenceRemap.noCandidates')}</div>
			) : (
				<Select
					value={replacement}
					onChange={onReplacementChange}
					// Graph order, not alphabetical: the list is upstream methods and the
					// nearest one is both the likeliest replacement and the one whose
					// response is most likely to carry the same field.
					sortOptions={false}
					options={[
						{ value: CLEAR, label: t('referenceRemap.clear') },
						...target.candidates.map((candidate) => ({
							value: candidate.color, label: candidate.label,
						})),
					]}
					testId={`workflow-reference-remap-${target.color.replace('#', '')}`}
				/>
			)}
			{/* The fields only become a question once there is a method to read them
			    from, and each is asked separately: a replacement's response rarely
			    has the same shape, and keeping `body.$.id` on a method that has no
			    such field leaves a reference that looks valid and resolves to
			    nothing. Pre-filled with the path it reads today, which is right
			    whenever the two methods do agree. */}
			{chosen && target.sources.length > 0 && (
				<div className='referenceRemapSources'>
					{target.sources.map((source) => (
						<div className='referenceRemapSource' key={source.key}>
							<span className='referenceRemapSourcePath'>{source.label}</span>
							<span className='referenceRemapSourceArrow' aria-hidden='true'>→</span>
							<div className='referenceRemapSourceField'>
								<LegacyResponseFieldSelect
									method={chosen.method}
									type={source.messageProperty as ResponseType}
									value={paths[source.key] ?? source.path}
									popupZIndex={CONFIRM_POPUP_Z_INDEX}
									onChange={(next) => onPathChange(source.key, next ?? '')}
								/>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
