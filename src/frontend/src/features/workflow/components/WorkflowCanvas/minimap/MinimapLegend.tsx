import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { ThemeMode } from '@shared/theme/types';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { MinimapGroup } from './minimap.model';
import { groupColor, OTHER_CONNECTOR_COLOR } from './minimapPalette';

type Props = { groups: MinimapGroup[]; themeMode: ThemeMode };

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
			case 'trigger': return t('minimap.legend.trigger');
			case 'operator': return t('minimap.legend.operator');
			default: {
				const _exhaustive: never = group;
				return _exhaustive;
			}
		}
	};

	const entry = (key: string, label: string, color: string, isDiamond: boolean) => (
		<li key={key} className="workflowMinimapLegendItem">
			<span className={`workflowMinimapSwatch${isDiamond ? ' workflowMinimapSwatchDiamond' : ''}`}
				style={{ background: color }} aria-hidden />
			<Tooltip content={label}><span className="workflowMinimapLegendLabel">{label}</span></Tooltip>
		</li>
	);

	if (groups.length === 0) return null;
	return (
		<ul className="workflowMinimapLegend" data-testid="workflow-minimap-legend">
			{entries.map((group) => entry(group.key, labelOf(group), groupColor(group, themeMode), group.kind === 'operator'))}
			{hasOther && entry('other', t('minimap.legend.otherConnectors'), OTHER_CONNECTOR_COLOR, false)}
		</ul>
	);
}
