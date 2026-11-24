import { useCallback } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { NotificationTool } from '../tools/notificationTool.types';

export const useNotificationToolName = () => {
	const { t } = useI18n('workflow');
	return useCallback((tool: NotificationTool) => tool.nameKey ? t(tool.nameKey) : tool.name, [t]);
};
