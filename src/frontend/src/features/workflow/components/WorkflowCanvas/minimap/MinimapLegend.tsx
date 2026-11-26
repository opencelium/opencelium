import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { ThemeMode } from '@shared/theme/types';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { MinimapGroup, MinimapShape } from './minimap.model';
import { groupColor, OTHER_CONNECTOR_COLOR } from './minimapPalette';
import { bellPath } from './minimapShapes';

type Props = { groups: MinimapGroup[]; themeMode: ThemeMode };

type SwatchShape = Exclude<MinimapShape, 'start'>;

const SWATCH_CLASS: Record<Exclude<SwatchShape, 'bell'>, string> = {
	circle: '',
	diamond: ' workflowMinimapSwatchDiamond',
};

function Swatch({ shape, color }: { shape: SwatchShape; color: string }) {
	if (shape === 'bell') {
		return (
			<svg className="workflowMinimapSwatch workflowMinimapSwatchBell" viewBox="-1 -1 2 2" aria-hidden>
				<path d={bellPath(0, 0, 1)} fill={color} />
			</svg>
		);
	}
	return <span className={`workflowMinimapSwatch${SWATCH_CLASS[shape]}`} style={{ background: color }} aria-hidden />;
}

/**
 * Connector names are user-chosen and can be long, so an entry never grows past the
 * legend's width: it truncates, and the full name is on hover. Past a few rows the
 * list scrolls rather than pushing the map off the card.
 */
export function MinimapLegend({ groups, themeMode }: Props) {
	const { t } = useI18n('workflow');
	// Several connectors past the last colour share one swatch, and so one entry.
	const hasOther = groups.some((group) => group.kind === 'connector' && group.slot === 'other');
	const entries = groups.filter((group) => group.kind !== 'connector' || group.slot !== 'other');

	const labelOf = (group: MinimapGroup) => {
		switch (group.kind) {
			case 'connector': return group.label;
			case 'system': return t('minimap.legend.system');
			case 'notification': return t('minimap.legend.notification');
			case 'trigger': return t('minimap.legend.trigger');
			case 'operator': return t('minimap.legend.operator');
			default: {
				const _exhaustive: never = group;
				return _exhaustive;
			}
		}
	};

	const shapeOf = (group: MinimapGroup): SwatchShape =>
		group.kind === 'operator' ? 'diamond' : group.kind === 'notification' ? 'bell' : 'circle';

	const entry = (key: string, label: string, color: string, shape: SwatchShape) => (
		<li key={key} className="workflowMinimapLegendItem">
			<Swatch shape={shape} color={color} />
			<Tooltip content={label}><span className="workflowMinimapLegendLabel">{label}</span></Tooltip>
		</li>
	);

	if (groups.length === 0) return null;
	return (
		<ul className="workflowMinimapLegend" data-testid="workflow-minimap-legend">
			{entries.map((group) => entry(group.key, labelOf(group), groupColor(group, themeMode), shapeOf(group)))}
			{hasOther && entry('other', t('minimap.legend.otherConnectors'), OTHER_CONNECTOR_COLOR, 'circle')}
		</ul>
	);
}
