import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Icon } from '@shared/ui/primitives/Icon';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { ChevronUp, Loader2, Maximize2, Minimize2, Trash2 } from 'lucide-react';
import { useMethodViewMode } from '@features/logs';
import type { WorkflowLogsHeaderProps } from './WorkflowLogs.types';

function MethodViewButton() {
	const { t } = useI18n('logs');
	const { mode, setMode } = useMethodViewMode();
	const active = mode === 'name';

	return (
		<Tooltip content={t('methodView.tooltip')}>
			<button
				className={`logsHeaderIconButton ${active ? 'logsHeaderIconButton--active' : ''}`}
				type='button'
				onClick={() => setMode(active ? 'url' : 'name')}
				aria-label={t('methodView.tooltip')}
			>
				<Icon name='arrow-switch' size={15} color='inherit' />
			</button>
		</Tooltip>
	);
}

export function WorkflowLogsHeader(props: WorkflowLogsHeaderProps) {
	const { t: tLogs } = useI18n('logs');
	const { t: tCommon } = useI18n('common');
	const sizeLabel = tCommon(props.panel === 'full' ? 'dialog.restore' : 'dialog.maximize');

	return (
		<div className='logsHeaderRow'>
			<button className='logsHeader' type='button' onClick={props.onToggleMinimized} aria-label={tLogs(props.isExpanded ? 'live.collapse' : 'live.expand')}>
				<span className='logsHeaderTitle'>
					<span>{tLogs('live.title')}</span>
					{props.isRunning && <span className='logsRunning'><Loader2 size={13} className='logsRunningSpinner' />{tLogs('live.running')}</span>}
				</span>
			</button>
			{props.isExpanded && props.hasLogs && <MethodViewButton />}
			{props.isExpanded && props.hasLogs && !props.isRunning && (
				<Tooltip content={tLogs('live.clear')}>
					<button className='logsHeaderIconButton' type='button' onClick={props.onClear} aria-label={tLogs('live.clear')}><Trash2 size={15} /></button>
				</Tooltip>
			)}
			{props.isExpanded && (
				<Tooltip content={sizeLabel}>
					<button className='logsHeaderIconButton' type='button' onClick={props.onToggleFull} aria-label={sizeLabel}>
						{props.panel === 'full' ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
					</button>
				</Tooltip>
			)}
			<Tooltip placement='topLeft' content={tLogs(props.isExpanded ? 'live.collapse' : 'live.expand')}>
				<button className='logsHeaderIconButton' type='button' onClick={props.onToggleMinimized} aria-label={tLogs(props.isExpanded ? 'live.collapse' : 'live.expand')}>
					<ChevronUp size={18} className={`logsCaret ${props.isExpanded ? 'logsCaretExpanded' : ''}`} />
				</button>
			</Tooltip>
		</div>
	);
}
