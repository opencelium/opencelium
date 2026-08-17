import type { MouseEvent } from 'react';
import type { NodeProps } from '@xyflow/react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Icon } from '@shared/ui/primitives/Icon';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { LoopWorkflowNode } from '../../types/workflow.types';
import { useTestRun } from '../../test-run/useTestRun';
import { AggregatorBadge } from '../AggregatorBadge/AggregatorBadge';
import { NodeShell } from '../NodeShell/NodeShell';
import { StandardNodeHandles } from '../StandardNodeHandles/StandardNodeHandles';

export function LoopOperatorNode({ id, data, selected, dragging }: NodeProps<LoopWorkflowNode>) {
	const { t } = useI18n('workflow');
	const testRun = useTestRun();

	const iteration = data.testRunIteration;
	const iterationLabel = iteration
		? t('node.testRunIteration', { iterator: iteration.iterator, count: iteration.count })
		: undefined;
	// Only meaningful while the paused run is actually tracking THIS loop's
	// iteration (see WorkflowLoopIterationDisplay/getTestRunScope) — otherwise
	// there is no "current iteration" to skip past.
	const canSkipIteration = !!testRun?.isPaused && !!iteration;

	const handleSkipIteration = (event: MouseEvent<HTMLSpanElement>) => {
		event.stopPropagation();
		if (!iteration) return;
		testRun?.skipToNextIteration(iteration.indexPath);
	};

	return (
		<NodeShell
			id={id}
			data={data}
			selected={selected}
			rightAdd={{
				action: { sourceNodeId: id, sourceHandle: 'right', direction: 'right' },
				showAlways: !!data.rightLeaf,
				lineVisible: !!data.rightLeaf,
			}}
			bottomAdd={{
				action: { sourceNodeId: id, sourceHandle: 'bottom', direction: 'bottom' },
				showAlways: !!data.bottomLeaf,
				lineVisible: !!data.bottomLeaf,
			}}
		>
			<div className='ifNode'>
				<div className='operatorInnerText'>{t('node.loop')}</div>
			</div>
			<AggregatorBadge
				dataAggregator={data.dataAggregator}
				testId={`workflow-node-aggregator-${id}`}
				suppressTooltip={dragging || data.isAnyNodeDragging}
				onOpenAggregatorEditor={() => data.onOpenAggregatorEditor?.(id)}
			/>
			{iterationLabel && (
				<div className='loopIterationLabel'>
					<span>{iterationLabel}</span>
					{canSkipIteration && (
						<span
							className='loopSkipIterationIcon nodrag nopan'
							data-testid={`workflow-node-skip-iteration-${id}`}
							onClick={handleSkipIteration}
							onDoubleClick={(event) => event.stopPropagation()}
						>
							<Tooltip content={t('node.skipToNextIteration')} placement='top'>
								<Icon name='skip-forward' size={12} color='primary' />
							</Tooltip>
						</span>
					)}
				</div>
			)}
			<StandardNodeHandles />
		</NodeShell>
	);
}
