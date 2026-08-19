import { useCallback, useEffect, useState } from 'react';
import type { SecondarySidebarMode } from '../sidebar/sidebarSecondary';

type Params = {
	open: boolean;
	onClose: () => void;
	onSelectSystem: () => void;
	onSelectComment: () => void;
};

export function useWorkflowSidebarState({ open, onClose, onSelectSystem,
	onSelectComment }: Params) {
	const [activeSecondaryPanel, setActiveSecondaryPanel] = useState<SecondarySidebarMode | null>(null);
	const [selectedConnectorKey, setSelectedConnectorKey] = useState<string | null>(null);
	const [mainSearch, setMainSearch] = useState('');
	const [secondarySearch, setSecondarySearch] = useState('');
	const [methodSearch, setMethodSearch] = useState('');
	const resetSidebar = useCallback(() => {
		setActiveSecondaryPanel(null);
		setSelectedConnectorKey(null);
		setMainSearch('');
		setSecondarySearch('');
		setMethodSearch('');
	}, []);

	useEffect(() => {
		if (!open) resetSidebar();
	}, [open, resetSidebar]);

	const closeSidebar = () => {
		resetSidebar();
		onClose();
	};
	const openTriggerConnection = () => {
		setSelectedConnectorKey(null);
		setActiveSecondaryPanel('trigger-connection');
	};
	const onSelectMain = (key: string) => {
		setSecondarySearch('');
		setMethodSearch('');
		setSelectedConnectorKey(null);
		if (key === 'operator') return setActiveSecondaryPanel('operator');
		if (key === 'system') {
			resetSidebar();
			return onSelectSystem();
		}
		if (key === 'comment') {
			resetSidebar();
			return onSelectComment();
		}
		if (key === 'trigger-connection') return openTriggerConnection();
		setActiveSecondaryPanel('connector');
	};
	const openConnector = (connectorKey: string) => {
		setSelectedConnectorKey(connectorKey);
		setActiveSecondaryPanel('connector');
		setSecondarySearch('');
		setMethodSearch('');
	};
	const closeSecondary = () => {
		setActiveSecondaryPanel(null);
		setSelectedConnectorKey(null);
		setSecondarySearch('');
		setMethodSearch('');
	};
	const selectConnector = (connectorKey: string) => {
		setSelectedConnectorKey(connectorKey);
		setMethodSearch('');
	};
	const closeMethod = () => {
		setSelectedConnectorKey(null);
		setMethodSearch('');
	};

	return {
		activeSecondaryPanel,
		closeMethod,
		closeSecondary,
		closeSidebar,
		mainSearch,
		methodSearch,
		onSelectMain,
		openConnector,
		resetSidebar,
		secondarySearch,
		selectConnector,
		selectedConnectorKey,
		setMainSearch,
		setMethodSearch,
		setSecondarySearch,
	};
}
