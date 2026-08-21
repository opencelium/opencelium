import { useRefreshConnectorStatusMutation } from '@entities/connector/api/connectorApi';
import { useDialog } from '@shared/ui/dialog/useDialog';
import { EntityDialogContent } from '@/engine/entity/runtime/genererics/EntityDialogContent';

/**
 * Opens the connector's own create form from the connector picker, so a workflow
 * that needs a connector nobody has set up yet doesn't have to be abandoned
 * half-built to go and make one.
 *
 * The form is the entity wizard, so saving invalidates the 'Entity' tag and the
 * picker's list refetches on its own — the new connector then shows up in the list
 * to be picked.
 *
 * Its health is checked straight away, because the backend only sweeps connectors
 * every few minutes: without this the row a user just created would sit on a grey
 * "hasn't been tested yet" dot for minutes, which reads as something being wrong
 * with it. Fire-and-forget — the dot is what reports the outcome, including a
 * check that failed.
 */
export const useConnectorCreateAction = (): (() => void) => {
	const dialog = useDialog();
	const [refreshStatus] = useRefreshConnectorStatusMutation();

	return () => {
		const id = dialog.open({
			width: 1000,
			top: 18,
			testId: 'workflow-sidebar-connector-create-dialog',
			content: (
				<EntityDialogContent
					entityName='connector'
					mode='create'
					onSuccess={(created) => {
						dialog.closeById(id);
						const connectorId = (created as { connectorId?: number } | undefined)?.connectorId;
						if (connectorId != null) void refreshStatus(connectorId);
					}}
				/>
			),
		});
	};
};
