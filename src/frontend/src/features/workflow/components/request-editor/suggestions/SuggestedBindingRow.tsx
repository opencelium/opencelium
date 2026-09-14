import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Icon } from '@shared/ui/primitives/Icon';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { Typography } from '@shared/ui/primitives/Typography';
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import { SuggestionSourceIcon } from './SuggestionSourceIcon';
import { getReferenceMethodLabel } from '../reference-generator/referenceGenerator.utils';
import type { MethodWithId } from '../../../types/connection';
import type { FieldBindingSuggestion } from '../../../ai/fieldBindingSuggestion.types';

/** The panel sits inside an antd Modal, so tooltips need the dialog's stacking context. */
const DIALOG_TOOLTIP_Z_INDEX = 13020;

type Props = {
	suggestion: FieldBindingSuggestion;
	sourceMethod?: MethodWithId;
	onApply: () => void;
	onDismiss: () => void;
};

const stripRoot = (path: string) => path.replace(/^\$\.?/, '') || '$';

export function SuggestedBindingRow({ suggestion, sourceMethod, onApply, onDismiss }: Props) {
	const { t } = useI18n('workflow');
	const originLabel = t(`suggestions.origin.${suggestion.origin}`);
	const percent = Math.round(suggestion.confidence * 100);

	return (
		<li className='wfSuggestionRow' data-testid={`workflow-suggestion-${suggestion.targetPath}`}>
			<div className='wfSuggestionRowMain'>
				<div className='wfSuggestionSource'>
					<SuggestionSourceIcon method={sourceMethod} color={suggestion.sourceColor}
						tooltipZIndex={DIALOG_TOOLTIP_Z_INDEX} />
					<Typography variant='caption' isSubtle>
						{sourceMethod ? getReferenceMethodLabel(sourceMethod) : ''}
					</Typography>
					<span className='wfSuggestionPath'>{stripRoot(suggestion.sourcePath)}</span>
				</div>
				<Icon name='chevron-right' size={14} isSubtle className='wfSuggestionArrow' />
				<span className='wfSuggestionPath wfSuggestionPath--target'>
					{stripRoot(suggestion.targetPath)}
				</span>
			</div>
			<div className='wfSuggestionMeta'>
				<Tooltip content={suggestion.rationale || originLabel} placement='top'
					zIndex={DIALOG_TOOLTIP_Z_INDEX}>
					<span className={`wfSuggestionOrigin wfSuggestionOrigin--${suggestion.origin}`}>
						{originLabel} · {t('suggestions.confidence', { percent })}
					</span>
				</Tooltip>
				<Tooltip content={t('suggestions.apply')} placement='top' zIndex={DIALOG_TOOLTIP_Z_INDEX}>
					<IconButton iconProps={{ name: 'check', size: 14, color: 'primary' }}
						type='text' size='xs' onClick={onApply}
						testId={`workflow-suggestion-apply-${suggestion.targetPath}`} />
				</Tooltip>
				<Tooltip content={t('suggestions.dismiss')} placement='top'
					zIndex={DIALOG_TOOLTIP_Z_INDEX}>
					<DeleteIconButton iconSize={14} onClick={onDismiss}
						testId={`workflow-suggestion-dismiss-${suggestion.targetPath}`} />
				</Tooltip>
			</div>
		</li>
	);
}
