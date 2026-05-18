import { ChevronUp } from 'lucide-react';
import { useState } from 'react';

export function WorkflowLogs() {
	const [expanded, setExpanded] = useState(false);

	return (
		<div className={`logsCard ${expanded ? 'logsCardExpanded' : ''}`}>
			<button
				className='logsHeader'
				type='button'
				onClick={() => setExpanded((current) => !current)}
			>
				<span>Logs</span>
				<ChevronUp
					size={18}
					className={`logsCaret ${expanded ? 'logsCaretExpanded' : ''}`}
				/>
			</button>

			{expanded && <div className='logsBody'>No logs yet.</div>}
		</div>
	);
}
