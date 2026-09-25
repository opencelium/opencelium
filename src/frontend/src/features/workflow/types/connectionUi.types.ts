export interface WorkflowConnectionUi {
	flowcharts: {
		flowId: string;
		x: number;
		y: number;
	}[];
	flowchartEdges: {
		id: string;
		source: string;
		target: string;
	}[];
	operators: any[];
}

export type UI = WorkflowConnectionUi;
