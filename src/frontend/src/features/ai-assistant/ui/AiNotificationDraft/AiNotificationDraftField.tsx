import { useState } from 'react';
import type { Mode } from '@/engine/entity/EntityDefinition';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { isAiConfigured, useGetAiHealthQuery } from '../../api/aiApi';
import { AiNotificationDraftPanel } from './AiNotificationDraftPanel';
import '../../styles/ai-notification.css';

/** "Draft with AI" at the top of a notification template's content step; absent in view mode and without the gateway. */
export function AiNotificationDraftField({ mode }: { mode?: Mode }) {
	const { t } = useI18n('entities');
	const isConfigured = isAiConfigured();
	const health = useGetAiHealthQuery(undefined, { skip: !isConfigured || mode === 'view' });
	const [isOpen, setIsOpen] = useState(false);
	const isAvailable = isConfigured && health.data?.ollama.reachable === true && health.data.workflowModel.available;
	if (mode === 'view' || !isAvailable) return null;
	if (!isOpen) {
		return (
			<div className="aiNotificationToggle">
				<Button iconLeft="sparkles" onClick={() => setIsOpen(true)} testId="ai-notification-open">{t('notification-template.aiDraft.open')}</Button>
			</div>
		);
	}
	return <AiNotificationDraftPanel onClose={() => setIsOpen(false)} />;
}
