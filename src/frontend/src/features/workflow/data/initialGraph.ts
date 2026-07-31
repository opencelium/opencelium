import type {
	WorkflowEdgeModel,
	WorkflowNodeModel,
} from '../types/workflow.types';

export const initialNodes: WorkflowNodeModel[] = [
	{
		id: 'start-1',
		type: 'start',
		position: { x: 120, y: 220 },
		data: {
			title: '',
			kind: 'start',
			isLeaf: true,
		},
		draggable: true,
		deletable: false,
	},
];

export const initialEdges: WorkflowEdgeModel[] = [];
