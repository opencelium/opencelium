/**
 * What an arc's colour means: the kind of binding it stands for, not which
 * method it comes from. Method identity is carried by the swatches
 * (MethodColorDot on the badges, cards and drawer), which is where a per-method
 * colour can be read without being mistaken for a status — an arc drawn in its
 * provider's colour left "blue" looking like a meaning of its own, and put a
 * method whose colour happens to be red next to the red that means broken.
 *
 * The three are the theme's own semantic tokens rather than literal hues, so
 * they follow a rebrand and stay legible in both themes. Orange for an
 * enhancement is the warning token doing duty as the palette's orange, not a
 * warning: an enhancement is a normal way to fill a field, and only the dashed
 * red says something is wrong.
 */
export const LENS_STROKE = {
	direct: 'var(--color-action-primary)',
	enhancement: 'var(--color-status-warning-fg)',
	broken: 'var(--color-status-error-fg)',
} as const;

type StrokeInput = {
	isBroken: boolean;
	hasScript: boolean;
};

/**
 * Broken first, then enhancement: a collapsed pair arc stands for several
 * bindings at once, and what matters about it descends in that order — an arc
 * with anything broken under it is a fault before it is anything else, and one
 * carrying a script is not a plain wire even if some of its bindings are.
 */
export const lensEdgeStroke = ({ isBroken, hasScript }: StrokeInput) => {
	if (isBroken) return LENS_STROKE.broken;
	return hasScript ? LENS_STROKE.enhancement : LENS_STROKE.direct;
};
