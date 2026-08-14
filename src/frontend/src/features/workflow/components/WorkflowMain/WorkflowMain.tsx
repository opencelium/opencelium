import { Background } from '@xyflow/react';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { WorkflowCanvas } from '../WorkflowCanvas/WorkflowCanvas';
import { WorkflowLogs } from '../WorkflowLogs/WorkflowLogs';
import type { WorkflowMainProps } from './WorkflowMain.types';

export const WorkflowMain = ({ loading, canvas }: WorkflowMainProps) =>
	<div className='workflowMain'>
		{loading ? <div style={{ width: '100%', height: '100%', display: 'flex',
			alignItems: 'center', justifyContent: 'center' }}>
			<Loading size='lg' />
		</div> : <>
			<WorkflowCanvas {...canvas}>
				<Background gap={16} size={1} />
			</WorkflowCanvas>
			<WorkflowLogs />
		</>}
	</div>;
