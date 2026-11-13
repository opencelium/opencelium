import { useI18n } from '@shared/i18n/hooks/useI18n';
import { CopyButton } from '@shared/ui/actions/CopyButton';
import { LogJsonView } from '@shared/ui/json-view/LogJsonView';
import type { MethodTestSentRequest } from '../../model/playground.types';
import { joinHeaderValues } from '../../model/sampleResponse';
import { toBodyText } from './responseFormat';

// A JSON payload comes back as text; parsed so it reads like the response body.
const readStructuredBody = (body: unknown): object | null => {
	if (body && typeof body === 'object') return body;
	if (typeof body !== 'string') return null;
	try {
		const parsed: unknown = JSON.parse(body);
		return parsed && typeof parsed === 'object' ? parsed : null;
	} catch {
		return null;
	}
};

// The request exactly as the backend sent it; connector secrets arrive masked as `****`.
export function SentRequest({ request }: { request: MethodTestSentRequest }) {
	const { t } = useI18n('workflow');
	const headers = Object.entries(joinHeaderValues(request.headers));
	const structuredBody = readStructuredBody(request.body);
	const bodyText = toBodyText(request.body, true);

	return (
		<div className='rpTabBody' data-testid='request-playground-sent-request'>
			<span className='rpHint'>{t('requestPlayground.response.sentHint')}</span>
			<div className='rpSentUrl'>
				<span className='rpMono rpSentMethod'>{request.method}</span>
				<span className='rpMono rpBreakAll' data-testid='request-playground-sent-url'>{request.url}</span>
				<span className='rpPushEnd' />
				<CopyButton value={request.url} />
			</div>
			<span className='rpSentLabel'>{t('requestPlayground.tabs.headers')}</span>
			{headers.length === 0
				? <span className='rpEmptyNote'>{t('requestPlayground.headers.empty')}</span>
				: <div className='rpTable'>
					{headers.map(([key, value]) => (
						<div key={key} className='rpGridRow rpHeaderRow'>
							<span className='rpHeaderKey'>{key}</span>
							<span className='rpMono rpBreakAll'>{value}</span>
						</div>
					))}
				</div>}
			<span className='rpSentLabel'>{t('requestPlayground.tabs.body')}</span>
			{!bodyText
				? <span className='rpEmptyNote'>{t('requestPlayground.body.empty')}</span>
				: <div className='rpCodeBox'>
					{structuredBody ? <LogJsonView data={structuredBody} bare /> : <pre className='rpRaw'>{bodyText}</pre>}
				</div>}
		</div>
	);
}
