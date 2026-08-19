import type { Dispatch, SetStateAction } from 'react';
import type { Connector } from '@entities/connector/model/types';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { WorkflowConnectionState } from '../api/connectionMapper';
import { useSaveConnectionTemplate } from './useSaveConnectionTemplate';
import { useLoadConnectionTemplate } from './useLoadConnectionTemplate';
import { useFinishApplyTemplate } from './useFinishApplyTemplate';
import { useApplyConnectionTemplate } from './useApplyConnectionTemplate';

type HeaderState = { title: string; description: string };

type Params = {
	connectionId?: string;
	headerState: HeaderState;
	setHeaderState: Dispatch<SetStateAction<HeaderState>>;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings?: any[];
	setFieldBindings: (bindings: any[] | undefined) => void;
	connectors: Connector[];
	getViewport: () => { x: number; y: number; zoom: number } | undefined;
	setWorkflowGraph: (nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[],
		viewport?: WorkflowConnectionState['viewport'],
		options?: { centerStart?: boolean }) => void;
};

export const useWorkflowTemplates = ({ connectionId, headerState, setHeaderState,
	nodes, edges, fieldBindings, setFieldBindings, connectors, getViewport,
	setWorkflowGraph }: Params) => {
	const save = useSaveConnectionTemplate({ connectionId, title: headerState.title,
		description: headerState.description, nodes, edges, fieldBindings, getViewport });
	const load = useLoadConnectionTemplate();
	const finishApply = useFinishApplyTemplate({ headerTitle: headerState.title,
		setHeaderState, setFieldBindings, setWorkflowGraph,
		closeDialog: () => load.setDialogOpen(false),
		clearSelection: () => load.setSelectedTemplateId(undefined),
	});
	const apply = useApplyConnectionTemplate({ templates: load.templates,
		selectedTemplateId: load.selectedTemplateId, connectors, finishApply,
		closeLoadDialog: () => load.setDialogOpen(false),
		clearSelection: () => load.setSelectedTemplateId(undefined),
	});

	return {
		templateDialogOpen: save.dialogOpen,
		templateName: save.name,
		setTemplateName: save.setName,
		templateDescription: save.description,
		setTemplateDescription: save.setDescription,
		templateNameError: save.nameError,
		setTemplateNameError: save.setNameError,
		isSavingTemplate: save.isSaving,
		isDownloadingTemplate: save.isDownloading,
		openSaveTemplateDialog: save.openDialog,
		closeSaveTemplateDialog: save.closeDialog,
		saveConnectionAsTemplate: save.saveTemplate,
		downloadConnectionTemplate: save.downloadTemplate,
		loadTemplateDialogOpen: load.dialogOpen,
		templates: load.templates,
		selectedTemplateId: load.selectedTemplateId,
		setSelectedTemplateId: load.setSelectedTemplateId,
		isLoadingTemplates: load.isLoading,
		isUploadingTemplate: load.isUploading,
		openLoadTemplateDialog: load.openDialog,
		uploadTemplateInLoadDialog: load.uploadTemplate,
		closeLoadTemplateDialog: load.closeDialog,
		isApplyingTemplate: apply.isApplying,
		connectorMappingDialogOpen: apply.mappingDialogOpen,
		connectorMappingGroups: apply.mappingGroups,
		applySelectedTemplate: apply.applySelected,
		handleConfirmConnectorMapping: apply.confirmMapping,
		handleCancelConnectorMapping: apply.cancelMapping,
	};
};
