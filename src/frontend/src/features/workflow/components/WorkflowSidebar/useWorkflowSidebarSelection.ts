import type { WorkflowCreateKind } from '../../types/workflow.types';
import type { WorkflowSidebarProps } from './WorkflowSidebar.types';
import { getMethodKey, normalizeConnectorIcon } from './useWorkflowSidebarItems';
import type { useWorkflowSidebarItems } from './useWorkflowSidebarItems';
import type { useWorkflowSidebarState } from './useWorkflowSidebarState';

type Items = ReturnType<typeof useWorkflowSidebarItems>;
type Sidebar = ReturnType<typeof useWorkflowSidebarState>;

export const useWorkflowSidebarSelection = ({
	onSelect,
	resetSidebar,
	mainSearchMethodItems,
	methodOperations,
	selectedConnector,
}: {
	onSelect: WorkflowSidebarProps['onSelect'];
	resetSidebar: Sidebar['resetSidebar'];
	mainSearchMethodItems: Items['mainSearchMethodItems'];
	methodOperations: Items['methodOperations'];
	selectedConnector: Items['selectedConnector'];
}) => {
	const selectOperator = (key: string) => {
		onSelect(key as WorkflowCreateKind);
		resetSidebar();
	};
	const selectSearchMethod = (key: string) => {
		const found = mainSearchMethodItems.find((item) => item.key === key);
		if (!found) return;
		onSelect('connector', found.operation.name, {
			connectorId: found.connectorId,
			title: found.text,
			icon: found.connectorIcon,
		}, found.operation);
		resetSidebar();
	};
	const selectMethod = (methodKey: string) => {
		const operation = methodOperations.find((item, index) =>
			getMethodKey(item, index) === methodKey);
		onSelect(
			'connector',
			operation?.name,
			selectedConnector ? {
				connectorId: selectedConnector.connectorId,
				title: selectedConnector.title,
				icon: normalizeConnectorIcon(selectedConnector.icon),
			} : undefined,
			operation,
		);
		resetSidebar();
	};

	return { selectOperator, selectSearchMethod, selectMethod };
};
