import { useMemo, useState } from 'react';
import { Panel, useReactFlow } from '@xyflow/react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useTheme } from '@shared/theme/hooks/useTheme';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { MinimapCanvas } from './MinimapCanvas';
import { MinimapIssueBar } from './MinimapIssueBar';
import { MinimapLegend } from './MinimapLegend';
import { MinimapZoomControls } from './MinimapZoomControls';
import { useMinimapCollapsed } from './useMinimapCollapsed';
import { useWorkflowMinimap } from './useWorkflowMinimap';

type Props = {
	fieldBindings: readonly unknown[] | undefined;
	/** Lifts the card clear of the minimized logs bar, which docks over the canvas' bottom edge. */
	isAboveLogsBar: boolean;
};

export function WorkflowMinimap({ fieldBindings, isAboveLogsBar }: Props) {
	const { t } = useI18n('workflow');
	const { themeMode } = useTheme();
	const { getNode, setCenter, getZoom } = useReactFlow();
	const { model, issues } = useWorkflowMinimap(fieldBindings);
	const { isCollapsed, toggle } = useMinimapCollapsed();
	// Tracked by node rather than by position, so fixing one issue does not jump the
	// pager to whichever step slid into its slot.
	const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);

	const issueNodeIds = useMemo(() => new Set(issues.map((issue) => issue.nodeId)), [issues]);
	const currentIndex = Math.max(0, issues.findIndex((issue) => issue.nodeId === currentNodeId));
	const current = issues[currentIndex] ?? null;

	const focusNode = (nodeId: string) => {
		const node = getNode(nodeId);
		if (!node) return;
		setCenter(node.position.x + (node.measured?.width ?? 0) / 2, node.position.y + (node.measured?.height ?? 0) / 2,
			{ zoom: getZoom(), duration: 200 });
	};

	const navigate = (step: -1 | 1) => {
		const next = issues[(currentIndex + step + issues.length) % issues.length];
		if (!next) return;
		setCurrentNodeId(next.nodeId);
		focusNode(next.nodeId);
	};

	return (
		<Panel position="bottom-right"
			className={`workflowMinimapPanel nopan nowheel nodrag${isAboveLogsBar ? ' workflowMinimapPanelAboveLogs' : ''}`}>
			<section className="workflowMinimap" data-testid="workflow-minimap">
				<header className="workflowMinimapHeader">
					<span className="workflowMinimapTitle">{t('minimap.title')}</span>
					<span className="workflowMinimapSteps">{t('minimap.stepCount', { count: model.stepCount })}</span>
					<Tooltip content={t(isCollapsed ? 'minimap.expand' : 'minimap.collapse')}>
						<IconButton type="text" size="xs" onClick={toggle} testId="workflow-minimap-toggle"
							iconProps={{ name: isCollapsed ? 'chevron-up' : 'chevron-down', color: 'inherit' }} />
					</Tooltip>
				</header>
				{!isCollapsed && (
					<>
						<MinimapCanvas model={model} issueNodeIds={issueNodeIds} themeMode={themeMode}
							currentIssueNodeId={current?.nodeId ?? null} ariaLabel={t('minimap.ariaLabel')} />
						<MinimapIssueBar issues={issues} currentIndex={currentIndex} onNavigate={navigate}
							onFocusCurrent={() => current && focusNode(current.nodeId)} />
						<footer className="workflowMinimapFooter">
							<MinimapLegend groups={model.groups} themeMode={themeMode} />
							<MinimapZoomControls />
						</footer>
					</>
				)}
			</section>
		</Panel>
	);
}
