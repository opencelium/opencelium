import { useState } from 'react';
import { Background, Handle, Position, ReactFlow } from '@xyflow/react';
import { Play } from 'lucide-react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Dialog } from '@shared/ui/primitives/Dialog';
import { workflowNodeTypes } from '../../components/WorkflowCanvas/workflowCanvasTypes';
import { NotificationDialog, type NotificationDialogTarget } from '../../notification/NotificationDialog';
import { NotificationOpenContext } from '../../notification/NotificationOpenContext';
import type { NotificationWorkflowNode, WorkflowNodeModel } from '../../types/workflow.types';

const initialNodes: WorkflowNodeModel[] = [
	{ id: 'start', type: 'start', position: { x: 0, y: 0 }, data: { kind: 'start', title: '' } },
	{ id: 'notification-empty', type: 'notification', position: { x: 180, y: 0 },
		data: { kind: 'notification', title: '', color: '#f5a623' } },
	{ id: 'notification-slack', type: 'notification', position: { x: 360, y: 0 },
		data: { kind: 'notification', title: '', color: '#d76437', notificationConfig: {
			tool: 'slack',
			drafts: { slack: { webhookUrl: 'https://hooks.slack.com/services/demo', message: {}, extraHeaders: [] } },
		} } },
];
const edges = [
	{ id: 'demo-start', source: 'start', target: 'notification-empty', sourceHandle: 'right', targetHandle: 'left' },
	{ id: 'demo-next', source: 'notification-empty', target: 'notification-slack', sourceHandle: 'right', targetHandle: 'left' },
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
	const [nodes, setNodes] = useState(initialNodes);
	const [target, setTarget] = useState<NotificationDialogTarget | null>(null);
	const [label, setLabel] = useState<string>();
	const node = nodes.find((item) => item.id === target?.id);
	const closeEditor = () => { setTarget(null); setLabel(undefined); };
	const save = (data: NotificationWorkflowNode['data']) => {
		setNodes((previous) => previous.map((item) => item.id === target?.id ? { ...item, data } : item));
	};

	const canvas = <div className="canvasCard" data-testid="workflow-notification-preview" style={{ height: 'min(60vh, 520px)', minHeight: 320 }}>
		<NotificationOpenContext.Provider value={setTarget}>
			<ReactFlow nodes={label === undefined ? nodes : nodes.map((item) => item.id === target?.id
				? { ...item, data: { ...item.data, subtitle: label } } : item)}
				edges={edges} nodeTypes={previewNodeTypes} fitView fitViewOptions={{ maxZoom: 1 }}
				zoomOnDoubleClick={false}
				nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}
				proOptions={{ hideAttribution: true }}>
				<Background />
			</ReactFlow>
		</NotificationOpenContext.Provider>
	</div>;

	return <>
		{onClose ? <Dialog open onClose={onClose} title={t('notification.demo')} width={920}
			testId="workflow-notification-demo-dialog">{canvas}</Dialog> : canvas}
		{target && node?.type === 'notification' && <NotificationDialog key={node.id} node={node} color={node.data.color}
			target={target} onClose={closeEditor} onLabelPreview={setLabel} onSave={save} />}
	</>;
}
