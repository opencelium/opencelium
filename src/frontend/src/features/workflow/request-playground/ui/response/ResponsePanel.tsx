import { Trans } from 'react-i18next';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Alert } from '@shared/ui/primitives/Alert';
import { Icon } from '@shared/ui/primitives/Icon';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { Tabs } from '@shared/ui/primitives/Tabs';
import type { PlaygroundRun } from '../../hooks/usePlaygroundSend';
import type { PlaygroundResponse } from '../../model/playground.types';
import { ResponseBody } from './ResponseBody';
import { ResponseHeaders } from './ResponseHeaders';
import { ResponseSummary } from './ResponseSummary';
import { ResponseTimeline } from './ResponseTimeline';

type Props = {
	result: PlaygroundResponse | undefined;
	isSending: boolean;
	sendingText: string;
	run: PlaygroundRun | null;
	canSaveSample: boolean;
	onSaveSample: () => void;
};

export function ResponsePanel({ result, isSending, sendingText, run, canSaveSample, onSaveSample }: Props) {
	const { t } = useI18n('workflow');
	const success = !isSending && result?.kind === 'success' ? result : undefined;
	const error = !isSending && result?.kind === 'error' ? result : undefined;

	return (
		<section className='rpResponse' data-testid='request-playground-response'>
			<ResponseSummary result={success} run={run} />
			{isSending && (
				<div className='rpPlaceholder rpPlaceholder--busy' data-testid='request-playground-sending'>
					<Loading size='md' />
					<span>{sendingText}</span>
				</div>
			)}
			{!isSending && !result && (
				<div className='rpPlaceholder' data-testid='request-playground-response-empty'>
					<Icon name='send' size={32} isSubtle />
					<span className='rpPlaceholderTitle'>{t('requestPlayground.response.emptyTitle')}</span>
					<span className='rpPlaceholderText'>
						<Trans ns='workflow' i18nKey='requestPlayground.response.emptyHint' components={{ b: <b /> }} />
					</span>
				</div>
			)}
			{error && (
				<Alert type='error' showIcon message={t(`requestPlayground.response.stage.${error.stage}`)}
					description={error.message || t('requestPlayground.response.noResponse')} />
			)}
			{success && (
				<div className='rpResponseTabs'>
					<Tabs isFullHeight items={[
						{ key: 'body', label: t('requestPlayground.response.tabs.body'), content:
							<ResponseBody body={success.response.body} canSaveSample={canSaveSample} onSaveSample={onSaveSample} /> },
						{ key: 'headers', label: t('requestPlayground.response.tabs.headers',
							{ count: Object.keys(success.response.headers ?? {}).length }),
						content: <ResponseHeaders headers={success.response.headers ?? {}} /> },
						{ key: 'timeline', label: t('requestPlayground.response.tabs.timeline'), content:
							<ResponseTimeline timings={success.timings} durationMs={success.durationMs} /> },
					]} />
				</div>
			)}
		</section>
	);
}
