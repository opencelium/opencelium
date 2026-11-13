import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Select } from '@shared/ui/primitives/Select';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { PlaygroundValues } from '../../hooks/usePlaygroundValues';
import type { PrefillSource } from '../../model/playground.types';

const PREFILL_SOURCES: PrefillSource[] = ['testRun', 'execution', 'lastTest', 'sample', 'manual'];

type Props = { values: PlaygroundValues };

export function PrefillSourceSelect({ values }: Props) {
	const { t } = useI18n('workflow');
	const sources = PREFILL_SOURCES.filter((source) => source !== 'execution' || values.executionId);
	const labelFor = (source: PrefillSource) => source === 'execution'
		? t('requestPlayground.prefill.execution', { id: values.executionId })
		: t(`requestPlayground.prefill.${source}`);

	return (
		<Tooltip content={t('requestPlayground.toolbar.prefill')}>
			<div className='rpPrefillSelect'>
				<Select<PrefillSource> value={values.prefillSource} onChange={values.setPrefillSource} sortOptions={false}
					testId='request-playground-prefill'
					options={sources.map((source) => ({
						value: source,
						label: source === 'execution'
							? <span data-testid='request-playground-prefill-execution'>{labelFor(source)}</span>
							: source === 'testRun' && !values.canUseTestRun
							? <Tooltip content={t('requestPlayground.prefill.testRunUnavailable')}>
								<span className='rpPrefillOptionLabel'>{t(`requestPlayground.prefill.${source}`)}</span>
							</Tooltip>
							: t(`requestPlayground.prefill.${source}`),
						searchLabel: labelFor(source),
						disabled: source === 'testRun' && !values.canUseTestRun,
					}))} />
			</div>
		</Tooltip>
	);
}
