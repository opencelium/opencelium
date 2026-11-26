import type { ThemeMode } from './types';

/**
 * Categorical hues: blue, amber, teal, violet — in fixed order,
 * stepped separately for each theme's surface. No red, orange or pink: red is what
 * marks a step that needs attention, and a hue near it would read as an error.
 * Four because that is as many non-red hues as stay distinguishable from one another
 * in every pairing, colour-blind vision included.
 */
export const CATEGORICAL_HUES: Record<ThemeMode, readonly string[]> = {
	light: ['#2a78d6', '#eda100', '#1baf7a', '#4a3aa7'],
	dark: ['#3987e5', '#c98500', '#199e70', '#7540dd'],
};

export const CATEGORICAL_SLOT_COUNT = CATEGORICAL_HUES.light.length;
