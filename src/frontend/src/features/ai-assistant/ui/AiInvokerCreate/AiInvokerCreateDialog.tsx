import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Alert } from '@shared/ui/primitives/Alert';
import { Button } from '@shared/ui/primitives/Button';
import { Dialog } from '@shared/ui/primitives/Dialog';
import { useAiInvokerCreate } from '../../invoker/useAiInvokerCreate';
import { AiInvokerDocsStep } from './AiInvokerDocsStep';
import { AiInvokerReviewStep } from './AiInvokerReviewStep';
import '../../styles/ai-invoker.css';

type Props = { open: boolean; onClose: () => void };

/** Docs in, invoker out: a draft from API documentation, reviewed and then uploaded like an invoker file. */
export function AiInvokerCreateDialog({ open, onClose }: Props) {
	const { t } = useI18n('entities');
	const create = useAiInvokerCreate(onClose);
	const { state, failure } = create;
	const isReview = state.step === 'review' || state.step === 'creating';

	const footer = isReview ? (
		<>
			<Button onClick={create.backToDocs} disabled={state.step === 'creating'} testId="ai-invoker-back">{t('invoker.list.aiCreate.back')}</Button>
			<Button type="primary" iconLeft="sparkles" onClick={() => void create.create()} loading={state.step === 'creating'}
				disabled={create.selected.size === 0} testId="ai-invoker-create">
				{t('invoker.list.aiCreate.create', { count: create.selected.size })}
			</Button>
		</>
	) : (
		<>
			<Button onClick={onClose} testId="ai-invoker-cancel">{t('invoker.list.aiCreate.cancel')}</Button>
			<Button type="primary" iconLeft="sparkles" onClick={() => void create.draft()} loading={state.step === 'drafting'}
				disabled={!create.docs.trim()} testId="ai-invoker-draft">{t('invoker.list.aiCreate.draft')}</Button>
		</>
	);

	return (
		<Dialog open={open} onClose={onClose} title={t('invoker.list.aiCreate.title')} footer={footer} width={860} top={18}
			maximizable testId="ai-invoker-dialog">
			{failure && <Alert type="error" showIcon message={t(failure === 'draft' ? 'invoker.list.aiCreate.draftFailed' : 'invoker.list.aiCreate.createFailed')} />}
			{state.step === 'drafting' && <div className="aiInvokerMeta">{t('invoker.list.aiCreate.drafting')}</div>}
			{isReview ? <AiInvokerReviewStep create={create} result={state.result} /> : <AiInvokerDocsStep create={create} />}
		</Dialog>
	);
}
