import { Trans } from 'react-i18next';
import type { Connector } from '@entities/connector/model/types';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Alert } from '@shared/ui/primitives/Alert';
import { Icon } from '@shared/ui/primitives/Icon';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { Tabs } from '@shared/ui/primitives/Tabs';
import type { PlaygroundRun } from '../../hooks/usePlaygroundSend';
import type { PlaygroundResult } from '../../model/playground.types';
import { ResponseBody } from './ResponseBody';
import { ResponseHeaders } from './ResponseHeaders';
import { ResponseSummary } from './ResponseSummary';
import { SentRequest } from './SentRequest';

type Props = {
	result: PlaygroundResult | undefined;
	isSending: boolean;
	sendingText: string;
	run: PlaygroundRun | null;
	connectors: readonly Connector[];
	canSaveSample: boolean;
	onSaveSample: () => void;
};

export function ResponsePanel({ result, isSending, sendingText, run, connectors, canSaveSample, onSaveSample }: Props) {
	const { t } = useI18n('workflow');
	const shown = isSending ? undefined : result;
	const sent = shown?.kind === 'sent' ? shown : undefined;
	const connectorTitle = (connectorId: number) =>
		connectors.find((connector) => connector.connectorId === connectorId)?.title ?? `#${connectorId}`;

	return (
		<section className='rpResponse' data-testid='request-playground-response'>
			<ResponseSummary result={sent} run={run} />
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
			{shown?.kind === 'failed' && (
				<Alert type='error' showIcon message={t('requestPlayground.response.failed')}
					description={shown.message ?? undefined} />
			)}
			{shown?.kind === 'connectorErrors' && (
				<div className='rpResponseAlerts' data-testid='request-playground-connector-errors'>
					{shown.errors.length === 0
						? <Alert type='error' showIcon message={t('requestPlayground.response.noResponse')} />
						: shown.errors.map(({ connectorId, message }) => (
							<Alert key={connectorId} type='error' showIcon description={message}
								message={t('requestPlayground.response.connectorError', { connector: connectorTitle(connectorId) })} />
						))}
				</div>
			)}
			{sent && (
				<div className='rpResponseTabs'>
					<Tabs isFullHeight items={[
						{ key: 'body', label: t('requestPlayground.response.tabs.body'), content:
							<ResponseBody body={sent.response.body} headers={sent.response.headers}
								canSaveSample={canSaveSample} onSaveSample={onSaveSample} /> },
						{ key: 'headers', label: t('requestPlayground.response.tabs.headers',
							{ count: Object.keys(sent.response.headers ?? {}).length }),
						content: <ResponseHeaders headers={sent.response.headers} /> },
						{ key: 'request', label: t('requestPlayground.response.tabs.request'), content:
							<SentRequest request={sent.request} /> },
					]} />
				</div>
			)}
		</section>
	);
}
