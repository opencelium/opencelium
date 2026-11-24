import { useState } from 'react';
import { Background, Handle, Position, ReactFlow } from '@xyflow/react';
import { Play } from 'lucide-react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Dialog } from '@shared/ui/primitives/Dialog';
import { workflowEdgeTypes, workflowNodeTypes } from '../../components/WorkflowCanvas/workflowCanvasTypes';
import { NotificationDialog } from '../../notification/ui/dialog/NotificationDialog';
import { NotificationEditorContext } from '../../notification/ui/NotificationEditorContext';
import { createNotificationConfig, selectTool, updateActiveDraft } from '../../notification/model/notificationConfig';
import type { NotificationConfig, NotificationEditorState } from '../../notification/model/notification.types';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';

const createDemoNodes = (title: string): WorkflowNodeModel[] => [
	{ id: 'start-1', type: 'start', position: { x: 0, y: 0 }, data: { kind: 'start', title: '' } },
	{ id: 'notification-empty', type: 'notification', position: { x: 180, y: 0 }, style: { pointerEvents: 'auto' },
		data: { kind: 'notification', title, color: '#f5a623' } },
	{ id: 'notification-slack', type: 'notification', position: { x: 360, y: 0 }, style: { pointerEvents: 'auto' },
		data: { kind: 'notification', title, color: '#d76437', notification: updateActiveDraft(
			selectTool(createNotificationConfig(), 'slack'),
			(draft) => ({ ...draft, webhookUrl: 'https://hooks.slack.com/services/demo' }),
		) } },
];
const edges: WorkflowEdgeModel[] = [
	{ id: 'demo-start', source: 'start-1', target: 'notification-empty', sourceHandle: 'right', targetHandle: 'left', type: 'workflow-edge' },
	{ id: 'demo-next', source: 'notification-empty', target: 'notification-slack', sourceHandle: 'right', targetHandle: 'left', type: 'workflow-edge' },
];

function DemoStart() {
	const { t } = useI18n('workflow');
	return <div className="nodeWrap">
		<div className="startNode"><Play size={24} aria-hidden="true" /></div>
		<div className="nodeBottomLabel">{t('notification.demoStart')}</div>
		<Handle id="right" type="source" position={Position.Right} className="handleInvisible" />
	</div>;
}

const previewNodeTypes = { start: DemoStart, notification: workflowNodeTypes.notification };

export default function NotificationNodePreview({ onClose }: { onClose?: () => void }) {
	const { t } = useI18n('workflow');
	const [nodes, setNodes] = useState(() => createDemoNodes(t('notification.dialog.kind')));
	const [editor, setEditor] = useState<NotificationEditorState | null>(null);
	const node = nodes.find((item) => item.id === editor?.nodeId) ?? null;
	const openEditor = (nodeId: string, target: NotificationEditorState['target'] = { kind: 'default' }) =>
		setEditor({ nodeId, target });
	const save = (nodeId: string, label: string, notification: NotificationConfig) => {
		setNodes((previous) => previous.map((item) => item.id === nodeId
			? { ...item, data: { ...item.data, subtitle: label, notification } } : item));
		setEditor(null);
	};

	const canvas = <div className="canvasCard" data-testid="workflow-notification-preview" style={{ height: 'min(60vh, 520px)', minHeight: 320 }}>
		<NotificationEditorContext.Provider value={openEditor}>
			<ReactFlow nodes={nodes} edges={edges} edgeTypes={workflowEdgeTypes} nodeTypes={previewNodeTypes} fitView fitViewOptions={{ maxZoom: 1 }}
				onNodeDoubleClick={(_, item) => { if (item.type === 'notification') openEditor(item.id); }}
				zoomOnDoubleClick={false} nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}
				proOptions={{ hideAttribution: true }}>
				<Background />
			</ReactFlow>
		</NotificationEditorContext.Provider>
	</div>;

	return <>
		{onClose ? <Dialog open onClose={onClose} title={t('notification.demo')} width={920}
			testId="workflow-notification-demo-dialog">{canvas}</Dialog> : canvas}
		<NotificationDialog editor={editor} node={node} nodes={nodes} edges={edges}
			onClose={() => setEditor(null)} onSave={save} />
	</>;
}
