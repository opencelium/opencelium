import { Background } from '@xyflow/react';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { Splitter } from '@shared/ui/primitives/Splitter';
import { useEffect, useRef, useState } from 'react';
import { WorkflowCanvas } from '../WorkflowCanvas/WorkflowCanvas';
import { WorkflowLogs } from '../WorkflowLogs/WorkflowLogs';
import type { WorkflowMainProps } from './WorkflowMain.types';
import type { WorkflowLogsPanelState } from '../WorkflowLogs/WorkflowLogs.types';
import { useTestRun } from '../../test-run/useTestRun';

export const WorkflowMain = ({ loading, canvas }: WorkflowMainProps) => {
	const testRun = useTestRun();
	const [logsPanel, setLogsPanel] = useState<WorkflowLogsPanelState>('minimized');
	const [logsPaneHeight, setLogsPaneHeight] = useState(430);
	const wasActiveRef = useRef(false);
	const isActive = (testRun?.phase ?? 'idle') !== 'idle' || !!testRun?.revealPending;
	useEffect(() => {
		if (isActive !== wasActiveRef.current) {
			setLogsPanel((current) => current === 'minimized' ? 'normal' : current);
		}
		wasActiveRef.current = isActive;
	}, [isActive]);

	const canvasElement = <WorkflowCanvas {...canvas}>
		<Background gap={16} size={1} />
	</WorkflowCanvas>;
	const logsElement = <WorkflowLogs panel={logsPanel} onPanelChange={setLogsPanel} />;

	return <div className='workflowMain'>
		{loading ? <div style={{ width: '100%', height: '100%', display: 'flex',
			alignItems: 'center', justifyContent: 'center' }}>
			<Loading size='lg' />
		</div> : <>
			<Splitter layout='vertical' className='workflowSplitter'
				panels={logsPanel === 'normal' ? [
					{ key: 'canvas', content: canvasElement, min: 160 },
					{ key: 'logs', content: logsElement, defaultSize: logsPaneHeight,
						min: 120, max: '80%' },
				] : [{ key: 'canvas', content: canvasElement, min: 160 }]}
				onResizeEnd={(sizes) => setLogsPaneHeight(sizes[1] ?? logsPaneHeight)} />
			{logsPanel !== 'normal' && logsElement}
		</>}
	</div>;
};
