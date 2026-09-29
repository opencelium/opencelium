import { useDialog } from '@shared/ui/dialog/useDialog';
import { EntityDialogContent } from '@/engine/entity/runtime/genererics/EntityDialogContent';

type Options = {
	testId: string;
	/** Wizard step to open on — 'credentials' for a connector that can't connect. */
	initialStepId?: string;
};

/**
 * Opens the connector's own update wizard over the workflow editor. Saving
 * invalidates the 'Entity' tag, so status snapshots refetch on their own.
 */
export const useOpenConnectorUpdateDialog = () => {
	const dialog = useDialog();

	return (connectorId: string, { testId, initialStepId }: Options) => {
		const id = dialog.open({
			width: 1000,
			top: 18,
			testId,
			content: (
				<EntityDialogContent
					entityName='connector'
					mode='update'
					identifier={connectorId}
					initialStepId={initialStepId}
					onSuccess={() => dialog.closeById(id)}
				/>
			),
		});
	};
};
