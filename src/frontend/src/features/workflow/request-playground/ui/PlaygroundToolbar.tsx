import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Select } from '@shared/ui/primitives/Select';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { PlaygroundSession } from '../hooks/usePlaygroundSession';
import type { PlaygroundValues } from '../hooks/usePlaygroundValues';
import type { PrefillSource } from '../model/playground.types';

const PREFILL_SOURCES: PrefillSource[] = ['testRun', 'lastTest', 'sample', 'upstream', 'manual'];

type Props = { session: PlaygroundSession; values: PlaygroundValues };

export function PlaygroundToolbar({ session, values }: Props) {
	const { t } = useI18n('workflow');

	return (
		<div className='rpToolbar'>
			{session.connectors.length > 0 && (
				<label className='rpField'>
					<span className='rpFieldLabel'>{t('requestPlayground.toolbar.connector')}</span>
					<Select<number> value={session.connectorId ?? undefined} onChange={session.setConnectorId}
						testId='request-playground-connection'
						options={session.connectors.map((connector) => ({ value: connector.connectorId, label: connector.title }))} />
				</label>
			)}
			<label className='rpField rpField--wide'>
				<span className='rpFieldLabel'>{t('requestPlayground.toolbar.prefill')}</span>
				<Select<PrefillSource> value={values.prefillSource} onChange={values.setPrefillSource} sortOptions={false}
					testId='request-playground-prefill'
					options={PREFILL_SOURCES.map((source) => ({
						value: source,
						label: source === 'testRun' && !values.canUseTestRun
							? <Tooltip content={t('requestPlayground.prefill.testRunUnavailable')}>
								<span>{t(`requestPlayground.prefill.${source}`)}</span>
							</Tooltip>
							: t(`requestPlayground.prefill.${source}`),
						searchLabel: t(`requestPlayground.prefill.${source}`),
						disabled: source === 'testRun' && !values.canUseTestRun,
					}))} />
			</label>
		</div>
	);
}
