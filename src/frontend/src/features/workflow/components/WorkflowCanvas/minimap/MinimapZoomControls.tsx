import { useReactFlow, useStore } from '@xyflow/react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';

const ANIMATION = { duration: 200 };

export function MinimapZoomControls() {
	const { t } = useI18n('workflow');
	const { zoomIn, zoomOut, fitView } = useReactFlow();
	const zoom = useStore((state) => state.transform[2]);
	const minZoom = useStore((state) => state.minZoom);
	const maxZoom = useStore((state) => state.maxZoom);

	return (
		<div className="workflowMinimapZoom">
			<Tooltip content={t('minimap.zoomOut')}>
				<IconButton type="text" size="xs" iconProps={{ name: 'minus', color: 'inherit' }}
					disabled={zoom <= minZoom} onClick={() => zoomOut(ANIMATION)} testId="workflow-minimap-zoom-out" />
			</Tooltip>
			<span className="workflowMinimapZoomValue" data-testid="workflow-minimap-zoom-value">
				{Math.round(zoom * 100)}%
			</span>
			<Tooltip content={t('minimap.zoomIn')}>
				<IconButton type="text" size="xs" iconProps={{ name: 'plus', color: 'inherit' }}
					disabled={zoom >= maxZoom} onClick={() => zoomIn(ANIMATION)} testId="workflow-minimap-zoom-in" />
			</Tooltip>
			<Tooltip content={t('minimap.fitView')}>
				<IconButton type="text" size="xs" iconProps={{ name: 'fit-view', color: 'inherit' }}
					onClick={() => fitView(ANIMATION)} testId="workflow-minimap-fit-view" />
			</Tooltip>
		</div>
	);
}
