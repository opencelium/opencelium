import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useDialog } from '@shared/ui/dialog/useDialog';
import { EntityDialogContent } from '@/engine/entity/runtime/genererics/EntityDialogContent';
import type { SidebarListProps } from '../sidebar/SidebarList/SidebarList.types';

/**
 * Lets the connector picker open the connector's own update form for a connector
 * the backend can't reach — the fix for a failing connection is almost always its
 * credentials, and walking out of the workflow to the connector list to make it
 * would lose the half-built step.
 *
 * The form is the entity wizard, so saving invalidates the 'Entity' tag and the
 * picker's status snapshot refetches on its own.
 */
export const useConnectorUpdateAction = (): NonNullable<SidebarListProps['updateAction']> => {
	const { t } = useI18n('workflow');
	const dialog = useDialog();

	return {
		tooltip: t('sidebar.connectorStep.fixConnector'),
		onUpdate: (connectorId: string) => {
			const id = dialog.open({
				width: 1000,
				top: 18,
				testId: 'workflow-sidebar-connector-update-dialog',
				content: (
					<EntityDialogContent
						entityName='connector'
						mode='update'
						identifier={connectorId}
						onSuccess={() => dialog.closeById(id)}
					/>
				),
			});
		},
	};
};
