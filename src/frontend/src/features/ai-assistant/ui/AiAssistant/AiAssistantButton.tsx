import { useI18n } from '@shared/i18n/hooks/useI18n';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { isAiConfigured, useGetAiHealthQuery } from '../../api/aiApi';
import { useAssistantStore } from '../../assistant/assistantStore';

/** "?" in the top bar; absent while the AI gateway cannot answer. */
export function AiAssistantButton() {
	const { t } = useI18n('common');
	const isConfigured = isAiConfigured();
	const health = useGetAiHealthQuery(undefined, { skip: !isConfigured });
	const { isOpen, open, close } = useAssistantStore();
	const isAvailable = isConfigured && health.data?.ollama.reachable === true && health.data.workflowModel.available;
	if (!isAvailable) return null;
	return (
		<Tooltip content={t('assistant.open')}>
			<IconButton type="text" iconProps={{ name: 'help', color: 'inherit', size: 18 }} onClick={() => (isOpen ? close() : open())}
				testId="topbar-assistant" />
		</Tooltip>
	);
}
