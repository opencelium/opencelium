import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useOpenConnectorUpdateDialog } from '../../connector-status/useOpenConnectorUpdateDialog';
import type { SidebarListProps } from '../sidebar/SidebarList/SidebarList.types';

/**
 * Lets the connector picker open the connector's own update form for a connector
 * the backend can't reach — the fix for a failing connection is almost always its
 * credentials, and walking out of the workflow to the connector list to make it
 * would lose the half-built step.
 */
export const useConnectorUpdateAction = (): NonNullable<SidebarListProps['updateAction']> => {
	const { t } = useI18n('workflow');
	const openConnectorUpdate = useOpenConnectorUpdateDialog();

	return {
		tooltip: t('sidebar.connectorStep.fixConnector'),
		onUpdate: (connectorId: string) =>
			openConnectorUpdate(connectorId, {
				testId: 'workflow-sidebar-connector-update-dialog',
				initialStepId: 'credentials',
			}),
	};
};
