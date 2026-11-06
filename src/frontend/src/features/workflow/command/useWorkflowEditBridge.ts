import { useEffect, useRef } from 'react';
import type { Connector } from '@entities/connector/model/types';
import type { WorkflowMethodEditorState } from '../types/request-config.types';
import { workflowCommandBridgeStore } from './workflowCommandBridge';

type Params = {
	connectors: Connector[];
	/** Read-only mode and a running test run both forbid edits. */
	isEditable: boolean;
	openRequestEditor: (editor: WorkflowMethodEditorState) => void;
	openConditionEditor: (nodeId: string) => void;
};

/**
 * The page-level half of the command bridge: what `useWorkflowPage` cannot see — the
 * loaded connectors and whether the editor may be changed right now. Read live through
 * refs, so a command started later sees the current values.
 */
export const useWorkflowEditBridge = ({ connectors, isEditable, openRequestEditor, openConditionEditor }: Params) => {
	const connectorsRef = useRef(connectors);
	const isEditableRef = useRef(isEditable);
	const openRequestEditorRef = useRef(openRequestEditor);
	useEffect(() => { connectorsRef.current = connectors; }, [connectors]);
	useEffect(() => { isEditableRef.current = isEditable; }, [isEditable]);
	useEffect(() => { openRequestEditorRef.current = openRequestEditor; }, [openRequestEditor]);
	const openConditionEditorRef = useRef(openConditionEditor);
	useEffect(() => { openConditionEditorRef.current = openConditionEditor; }, [openConditionEditor]);

	useEffect(() => {
		workflowCommandBridgeStore.setState({
			getConnectors: () => connectorsRef.current,
			isEditable: () => isEditableRef.current,
			openRequestEditor: (editor) => openRequestEditorRef.current(editor),
			openConditionEditor: (nodeId) => openConditionEditorRef.current(nodeId),
		});
	}, []);
};
