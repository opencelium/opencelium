import { useI18n } from '@shared/i18n/hooks/useI18n';
import { LogJsonView } from '@shared/ui/json-view/LogJsonView';
import { Alert } from '@shared/ui/primitives/Alert';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { Tabs } from '@shared/ui/primitives/Tabs';
import type { TestMethodResponse, TestMethodSentRequest } from './testMethod.types';

type Props = {
	result: TestMethodResponse | undefined;
	isSending: boolean;
};

function Payload({ value }: { value: unknown }) {
	if (value && typeof value === 'object') {
		return <div className='testMethodJson'><LogJsonView data={value} bare /></div>;
	}
	const text = value === undefined || value === null || value === '' ? '—' : String(value);
	return <pre className='testMethodRaw'>{text}</pre>;
}

function SentRequest({ request }: { request: TestMethodSentRequest }) {
	return (
		<div className='testMethodSection'>
			<div className='testMethodRequestLine'>
				<span className='testMethodVerb'>{request.method.toUpperCase()}</span>
				<span className='testMethodEndpoint' title={request.url}>{request.url}</span>
			</div>
			<Payload value={request.headers} />
			<Payload value={request.body} />
		</div>
	);
}

const statusTone = (status: number) => status >= 200 && status < 300 ? 'success' : status >= 400 ? 'error' : 'warning';

export function TestMethodResult({ result, isSending }: Props) {
	const { t } = useI18n('workflow');

	if (isSending) return <div className='testMethodPane testMethodPaneCentered'><Loading size='md' /></div>;
	if (!result) {
		return <div className='testMethodPane testMethodPaneCentered testMethodEmpty'>{t('testMethod.result.empty')}</div>;
	}
	if (result.kind === 'error') {
		return (
			<div className='testMethodPane' data-testid='workflow-test-method-result'>
				<Alert type='error' showIcon message={t(`testMethod.result.stage.${result.stage}`)} description={result.message} />
				{result.request && <SentRequest request={result.request} />}
			</div>
		);
	}

	const { response, request, durationMs } = result;
	return (
		<div className='testMethodPane' data-testid='workflow-test-method-result'>
			<div className='testMethodStatusLine'>
				<span className={`testMethodStatus testMethodStatus--${statusTone(response.status)}`}
					data-testid='workflow-test-method-status'>{response.status}</span>
				<span className='testMethodDuration'>{t('testMethod.result.duration', { ms: durationMs })}</span>
			</div>
			<Tabs defaultValue='body' items={[
				{ key: 'body', label: t('testMethod.result.body'), content: <Payload value={response.body} /> },
				{ key: 'headers', label: t('testMethod.result.headers'), content: <Payload value={response.headers} /> },
				{ key: 'request', label: t('testMethod.result.request'), content: <SentRequest request={request} /> },
			]} />
		</div>
	);
}
