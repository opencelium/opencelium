import type { ReactNode } from 'react';
import { LogRow, Meta, RequestResponseTabs, StatusBadge } from '@features/logs';
import { HttpMethodBadge } from '@shared/ui/http-method/HttpMethodBadge';
import { CopyButton } from '@shared/ui/actions/CopyButton';
import { Typography } from '@shared/ui/primitives/Typography';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Alert } from '@shared/ui/primitives/Alert';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { previewDraftRequest } from './buildTestMethodRequest';
import { TestMethodJsonView, type TestInputHighlight } from './TestMethodJsonView';
import { TestMethodUrl } from './TestMethodUrl';
import type { TestMethodDraft, TestMethodResponse } from './testMethod.types';
import type { Connection, MethodWithId } from '../types/connection';

type Props = TestInputHighlight & {
	draft: TestMethodDraft;
	connection: Connection;
	currentMethod?: MethodWithId;
	result: TestMethodResponse | undefined;
	isSending: boolean;
};

const RESULT_VIEW_PATH = 'test-method';

// The logs views take the raw text a log line carries, so objects are re-serialized.
const toText = (value: unknown) => {
	if (value === undefined || value === null) return '';
	return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
};

const placeholder = (content: ReactNode) => ({
	kind: 'placeholder' as const,
	content: <div className='testMethodResponsePlaceholder' data-testid='workflow-test-method-response-placeholder'>
		{content}
	</div>,
});

export function TestMethodResult({ draft, connection, currentMethod, result, isSending, selectedKey, onSelect, missingKeys }: Props) {
	const { t } = useI18n('workflow');
	const request = (!isSending && result?.request) || previewDraftRequest(draft);
	const success = !isSending && result?.kind === 'success' ? result : undefined;
	const error = !isSending && result?.kind === 'error' ? result : undefined;

	const jsonView = (data: unknown, testId: string) => data && typeof data === 'object'
		? <TestMethodJsonView data={data} testId={testId} connection={connection} currentMethod={currentMethod}
			selectedKey={selectedKey} onSelect={onSelect} missingKeys={missingKeys} />
		: undefined;

	const response = success
		? { kind: 'payload' as const, header: toText(success.response.headers), payload: toText(success.response.body) }
		: placeholder(isSending ? <Loading size='md' />
			: t(error ? 'testMethod.result.noResponse' : 'testMethod.result.empty'));

	return (
		<div className='testMethodPane' data-testid='workflow-test-method-result'>
			{error && <Alert type='error' showIcon message={t(`testMethod.result.stage.${error.stage}`)}
				description={error.message} />}
			<div className='testMethodLogRow' data-testid='workflow-test-method-sent-endpoint'>
				<LogRow
					left={<>
						<HttpMethodBadge method={request.method || 'GET'} />
						<TestMethodUrl url={request.url} connection={connection} currentMethod={currentMethod}
							selectedKey={selectedKey} onSelect={onSelect} missingKeys={missingKeys} />
						<CopyButton value={request.url} />
					</>}
					right={success && <Meta>
						<span data-testid='workflow-test-method-status'>
							<StatusBadge status={String(success.response.status)} />
						</span>
						<Typography variant='caption' isSubtle>
							{t('testMethod.result.duration', { ms: success.durationMs })}
						</Typography>
					</Meta>} />
			</div>
			<div className='testMethodExchange'>
				<RequestResponseTabs path={RESULT_VIEW_PATH} response={response} isFullHeight isBodyMaximizable
					requestHeader={toText(request.headers)} requestPayload={toText(request.body)}
					requestHeaderContent={jsonView(request.headers, 'workflow-test-method-request-header')}
					requestBodyContent={jsonView(request.body, 'workflow-test-method-request-body')} />
			</div>
		</div>
	);
}
