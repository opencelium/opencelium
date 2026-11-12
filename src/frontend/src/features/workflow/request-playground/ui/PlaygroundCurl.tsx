import type { Connector } from '@entities/connector/model/types';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { CopyButton } from '@shared/ui/actions/CopyButton';
import { Alert } from '@shared/ui/primitives/Alert';
import { Button } from '@shared/ui/primitives/Button';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import type { PlaygroundCurlModel } from '../hooks/usePlaygroundCurl';

type Props = {
	curl: PlaygroundCurlModel;
	connectors: readonly Connector[];
};

function CurlBody({ curl, connectors }: Props) {
	const { t } = useI18n('workflow');
	const { state } = curl;
	const connectorTitle = (connectorId: number) =>
		connectors.find((connector) => connector.connectorId === connectorId)?.title ?? `#${connectorId}`;

	if (curl.invalidCount) {
		return <Alert type='error' showIcon message={t('requestPlayground.curl.invalidJson', { count: curl.invalidCount })} />;
	}
	if (curl.isGenerating) {
		return <div className='rpCurlStatus'><Loading size='sm' inline /><span>{t('requestPlayground.curl.generating')}</span></div>;
	}
	switch (state.kind) {
		case 'idle':
			return <div className='rpCurlStatus'>{t('requestPlayground.curl.idle')}</div>;
		case 'ready':
			return <pre className='rpCurlCode' data-testid='request-playground-curl-code'>{state.command}</pre>;
		case 'failed':
			return <Alert type='error' showIcon message={t('requestPlayground.curl.failed')}
				description={state.message ?? undefined} />;
		case 'connectorErrors':
			return (
				<div className='rpResponseAlerts'>
					{state.errors.length === 0
						? <Alert type='error' showIcon message={t('requestPlayground.curl.failed')} />
						: state.errors.map(({ connectorId, message }) => (
							<Alert key={connectorId} type='error' showIcon description={message}
								message={t('requestPlayground.curl.connectorError', { connector: connectorTitle(connectorId) })} />
						))}
				</div>
			);
		default: {
			const _exhaustive: never = state;
			return _exhaustive;
		}
	}
}

export function PlaygroundCurl({ curl, connectors }: Props) {
	const { t } = useI18n('workflow');
	const command = curl.state.kind === 'ready' && !curl.isGenerating ? curl.state.command : '';
	return (
		<div className='rpCurl' data-testid='request-playground-curl'>
			<div className='rpCurlHeader'>
				<span>{t('requestPlayground.curl.title')}</span>
				<div className='rpCurlActions'>
					{curl.isOutdated && !curl.isGenerating && <span className='rpCurlOutdated'>{t('requestPlayground.curl.outdated')}</span>}
					<Button type='text' iconLeft='refresh' disabled={!curl.canGenerate} loading={curl.isGenerating}
						onClick={curl.generate} testId='request-playground-curl-regenerate'>
						{t(curl.state.kind === 'idle' ? 'requestPlayground.curl.generate' : 'requestPlayground.curl.regenerate')}
					</Button>
					<CopyButton value={command} testId='request-playground-curl-copy' />
				</div>
			</div>
			<CurlBody curl={curl} connectors={connectors} />
			{command && <div className='rpCurlNote'>{t('requestPlayground.curl.credentialsNote')}</div>}
		</div>
	);
}
