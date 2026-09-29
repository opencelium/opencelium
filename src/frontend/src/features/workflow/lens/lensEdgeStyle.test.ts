import { describe, expect, it } from 'vitest';
import { LENS_DASH, LENS_STROKE, lensEdgeStyle } from './lensEdgeStyle';

describe('lensEdgeStyle', () => {
	it('draws a plain wire solid, in the direct colour', () => {
		expect(lensEdgeStyle({ isBroken: false, hasScript: false }))
			.toEqual({ kind: 'direct', stroke: LENS_STROKE.direct, strokeDasharray: undefined });
	});

	it('dots anything carrying a script, in the enhancement colour', () => {
		expect(lensEdgeStyle({ isBroken: false, hasScript: true }))
			.toEqual({ kind: 'enhancement', stroke: LENS_STROKE.enhancement,
				strokeDasharray: LENS_DASH.enhancement });
	});

	// A pair arc is broken only when every binding under it is, so the break is
	// the whole arc's story by then — it outranks the script that carried it.
	it('dashes a broken arc in the broken colour, script or not', () => {
		expect(lensEdgeStyle({ isBroken: true, hasScript: false }).kind).toBe('broken');
		expect(lensEdgeStyle({ isBroken: true, hasScript: true }))
			.toEqual({ kind: 'broken', stroke: LENS_STROKE.broken,
				strokeDasharray: LENS_DASH.broken });
	});

	// Colour and pattern each have to tell the three apart on their own.
	it('keeps the three kinds distinguishable in both channels', () => {
		expect(new Set(Object.values(LENS_STROKE)).size).toBe(3);
		expect(new Set(Object.values(LENS_DASH)).size).toBe(3);
	});
});
