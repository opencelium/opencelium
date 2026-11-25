import type { ThemeMode } from '@shared/theme/types';
import { CATEGORICAL_HUES } from '@shared/theme/categoricalPalette';
import type { MinimapGroup } from './minimap.model';

/**
 * Connectors take the shared categorical hues; dots on a map are compared with
 * any other dot, not just a neighbour, which is why there are only four.
 */
const CONNECTOR_HUES = CATEGORICAL_HUES;

export const CONNECTOR_SLOT_COUNT = CONNECTOR_HUES.light.length;

/** A connector past the last slot shares one neutral swatch rather than a generated hue. */
export const OTHER_CONNECTOR_COLOR = 'var(--color-text-disabled)';

export const connectorColor = (slot: number | 'other', mode: ThemeMode): string =>
	slot === 'other' ? OTHER_CONNECTOR_COLOR : CONNECTOR_HUES[mode][slot];

/** Neutral groups stay out of the categorical range; the shape (circle vs diamond) tells them apart. */
const NEUTRAL_COLOR = {
	system: 'var(--color-text-secondary)',
	trigger: 'var(--color-border-strong)',
	operator: 'var(--color-text-secondary)',
} as const;

export const groupColor = (group: MinimapGroup, mode: ThemeMode): string =>
	group.kind === 'connector' ? connectorColor(group.slot, mode) : NEUTRAL_COLOR[group.kind];
