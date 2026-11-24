import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Tabs } from '@shared/ui/primitives/Tabs';
import type { NotificationTool } from '../../../tools/notificationTool.types';
import type { NotificationDialogState, NotificationRequestTab } from '../../dialog/useNotificationDialog';
import { RequestPanel } from './RequestPanel';
import { ResponsePanel } from './ResponsePanel';

type Props = { state: NotificationDialogState; tool: NotificationTool; nodeColor?: string };

export function RequestResponseStep({ state, tool, nodeColor }: Props) {
	const { t } = useI18n('workflow');
	return (
		<Tabs value={state.requestTab} onChange={(key) => state.setRequestTab(key as NotificationRequestTab)} items={[
			{ key: 'request', label: <span data-testid='notification-tab-request'>{t('notification.request.tab')}</span>,
				content: <RequestPanel state={state} /> },
			{ key: 'response', label: <span data-testid='notification-tab-response'>{t('notification.response.tab')}</span>,
				content: <ResponsePanel tool={tool} nodeColor={nodeColor} /> },
		]} />
	);
}
