import { useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { isAiConfigured, useGetAiHealthQuery } from '../../api/aiApi';
import { isAiFeatureOn } from '../../api/useIsAiFeatureOn';
import { AiInvokerCreateDialog } from './AiInvokerCreateDialog';

/** "Create with AI" beside the invoker list's Upload; shown only while the AI gateway can answer. */
export function AiInvokerCreateButton() {
	const { t } = useI18n('entities');
	const isConfigured = isAiConfigured();
	const health = useGetAiHealthQuery(undefined, { skip: !isConfigured });
	const [isOpen, setIsOpen] = useState(false);
	// Every opening starts from empty docs; the dialog's state lives in its own hook.
	const [session, setSession] = useState(0);
	const isAvailable = isConfigured && health.data?.ollama.reachable === true && health.data.workflowModel.available && isAiFeatureOn(health.data, 'invoker-from-docs');
	if (!isAvailable) return null;
	const open = () => {
		setSession((current) => current + 1);
		setIsOpen(true);
	};
	return (
		<>
			<Button iconLeft="sparkles" onClick={open} testId="invoker-ai-create">{t('invoker.list.aiCreate.button')}</Button>
			<AiInvokerCreateDialog key={session} open={isOpen} onClose={() => setIsOpen(false)} />
		</>
	);
}
