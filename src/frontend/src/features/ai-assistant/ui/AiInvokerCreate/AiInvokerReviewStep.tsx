import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Alert } from '@shared/ui/primitives/Alert';
import { Input } from '@shared/ui/primitives/Input';
import { Select } from '@shared/ui/primitives/Select';
import type { InvokerDraftAuthKind, InvokerDraftResponse } from '../../model/aiGateway.types';
import { isTestCandidate } from '../../invoker/invokerDraft.utils';
import type { AiInvokerCreate } from '../../invoker/useAiInvokerCreate';
import { AiInvokerOperationList } from './AiInvokerOperationList';

const NO_TEST = '';
const AUTH_KINDS: InvokerDraftAuthKind[] = ['none', 'basic', 'bearer', 'apikeyHeader', 'apikeyQuery'];

/** The draft to check before it becomes an invoker: name, base URL, authentication, connection test and operations. */
export function AiInvokerReviewStep({ create, result }: { create: AiInvokerCreate; result: InvokerDraftResponse }) {
	const { t } = useI18n('entities');
	const { draft } = result;
	const isBusy = create.state.step === 'creating';
	const testOptions = draft.operations.filter((op) => create.selected.has(op.name) && isTestCandidate(op))
		.map((op) => ({ value: op.name, label: `${op.name} (${op.path})` }));
	const setEdit = (patch: Partial<typeof create.edits>) => create.setEdits({ ...create.edits, ...patch });
	return (
		<div className="aiInvokerStep">
			<Alert type={result.source === 'openapi' ? 'success' : 'warning'} showIcon
				message={t(result.source === 'openapi' ? 'invoker.list.aiCreate.fromOpenApi' : 'invoker.list.aiCreate.fromAi')} />
			{result.isTruncated && <Alert type="warning" showIcon message={t('invoker.list.aiCreate.truncated')} />}
			<div className="aiInvokerFields">
				<label className="aiInvokerLabel">
					{t('invoker.list.aiCreate.nameLabel')}
					<Input value={create.edits.name} disabled={isBusy} onChange={(event) => setEdit({ name: event.target.value })}
						testId="ai-invoker-name" />
				</label>
				<label className="aiInvokerLabel">
					{t('invoker.list.aiCreate.baseUrlLabel')}
					<Input value={create.edits.baseUrl} disabled={isBusy} placeholder="https://{instance}.example.com/api"
						onChange={(event) => setEdit({ baseUrl: event.target.value })} testId="ai-invoker-base-url" />
				</label>
				<div className="aiInvokerLabel">
					{t('invoker.list.aiCreate.authLabel')}
					<Select value={create.edits.auth.kind} disabled={isBusy} sortOptions={false} testId="ai-invoker-auth"
						options={AUTH_KINDS.map((kind) => ({ value: kind, label: t(`invoker.list.aiCreate.auth.${kind}`, { name: '' }).trim() }))}
						onChange={(kind) => setEdit({ auth: { ...create.edits.auth, kind } })} />
				</div>
				{(create.edits.auth.kind === 'apikeyHeader' || create.edits.auth.kind === 'apikeyQuery') && (
					<label className="aiInvokerLabel">
						{t('invoker.list.aiCreate.keyNameLabel')}
						<Input value={create.edits.auth.keyName} disabled={isBusy} placeholder="X-API-Key"
							onChange={(event) => setEdit({ auth: { ...create.edits.auth, keyName: event.target.value } })} testId="ai-invoker-key-name" />
					</label>
				)}
				<div className="aiInvokerLabel">
					{t('invoker.list.aiCreate.testLabel')}
					<Select value={testOptions.some((option) => option.value === create.edits.testOperation) ? create.edits.testOperation : NO_TEST}
						disabled={isBusy} sortOptions={false} testId="ai-invoker-test-operation"
						options={[{ value: NO_TEST, label: t('invoker.list.aiCreate.noTest') }, ...testOptions]}
						onChange={(value) => setEdit({ testOperation: value })} />
				</div>
			</div>
			<AiInvokerOperationList operations={draft.operations} selected={create.selected} isDisabled={isBusy} onToggle={create.toggle} />
		</div>
	);
}
