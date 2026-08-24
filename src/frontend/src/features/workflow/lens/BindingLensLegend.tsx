import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { BindingLensSummary } from './bindingLens.types';

type BindingLensLegendProps = {
	summary: BindingLensSummary;
	isFocused: boolean;
};

export function BindingLensLegend({ summary, isFocused }: BindingLensLegendProps) {
	const { t } = useI18n('workflow');

	return (
		<div className='bindingLensLegend' data-testid='workflow-binding-lens-legend'>
			<div className='bindingLensLegendTitle'>{t('bindingLens.legendTitle')}</div>
			{summary.total === 0 ? (
				<div className='bindingLensLegendEmpty'>{t('bindingLens.legendEmpty')}</div>
			) : (
				<>
					<div className='bindingLensLegendRow'>
						<span className='bindingLensLegendMark bindingLensLegendMarkDirect' />
						{t('bindingLens.legendDirect', { count: summary.direct })}
					</div>
					<div className='bindingLensLegendRow'>
						<span className='bindingLensLegendMark bindingLensLegendMarkScript'>ƒx</span>
						{t('bindingLens.legendScript', { count: summary.script })}
					</div>
					<div className='bindingLensLegendRow'>
						<span className='bindingLensLegendMark bindingLensLegendMarkBroken' />
						{t('bindingLens.legendBroken', { count: summary.invalid })}
					</div>
				</>
			)}
			{/* The counts describe the whole workflow; the arcs only ever describe one
			    method, so an unfocused lens has to say how to ask for them. */}
			{summary.total > 0 && !isFocused && (
				<div className='bindingLensLegendNote'>{t('bindingLens.focusHint')}</div>
			)}
			{summary.notShown > 0 && (
				<div className='bindingLensLegendNote'>
					{t('bindingLens.legendNotShown', { count: summary.notShown })}
				</div>
			)}
		</div>
	);
}
