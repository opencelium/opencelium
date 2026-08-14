import { useNavigate } from 'react-router-dom';
import type { WorkflowHeaderMenuItem } from '../types/workflow.types';

type Params = {
	openAssignCategory: () => void;
	downloadTemplate: () => Promise<void> | void;
	openSaveTemplate: () => void;
	openLoadTemplate: () => Promise<void> | void;
	openShortcuts: () => void;
	openHistory: () => void;
	closeSchedules: () => void;
	closeCanvasPanels: () => void;
	refreshHistory: () => Promise<unknown> | void;
};

export const useWorkflowHeaderActions = ({ openAssignCategory, downloadTemplate,
	openSaveTemplate, openLoadTemplate, openShortcuts, openHistory,
	closeSchedules, closeCanvasPanels, refreshHistory }: Params) => {
	const navigate = useNavigate();

	const selectMenuItem = (item: WorkflowHeaderMenuItem) => {
		switch (item.id) {
			case 'assign-category': openAssignCategory(); break;
			case 'download-template': void downloadTemplate(); break;
			case 'save-template': openSaveTemplate(); break;
			case 'load-template': void openLoadTemplate(); break;
			case 'shortcuts': openShortcuts(); break;
			case 'exit': navigate('/workflow'); break;
		}
	};

	const showHistory = () => {
		closeSchedules();
		closeCanvasPanels();
		openHistory();
		void refreshHistory();
	};

	return { selectMenuItem, showHistory };
};
