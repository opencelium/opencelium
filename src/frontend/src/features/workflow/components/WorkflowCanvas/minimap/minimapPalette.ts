import type { ThemeMode } from '@shared/theme/types';
import type { MinimapGroup } from './minimap.model';

/**
 * Categorical hues for connectors: blue, amber, teal, violet — in fixed order,
 * stepped separately for each theme's surface. No red, orange or pink: red is what
 * marks a step that needs attention, and a hue near it would read as an error.
 * Four because that is as many non-red hues as stay distinguishable from one another
 * in every pairing, colour-blind vision included — dots on a map are compared with
 * any other dot, not just a neighbour.
 */
const CONNECTOR_HUES: Record<ThemeMode, readonly string[]> = {
	light: ['#2a78d6', '#eda100', '#1baf7a', '#4a3aa7'],
	dark: ['#3987e5', '#c98500', '#199e70', '#7540dd'],
};

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
