import { describe, expect, it } from 'vitest';
import { LENS_STROKE, lensEdgeStroke } from './lensEdgeStroke';

describe('lensEdgeStroke', () => {
	it('draws a plain wire in the direct colour', () => {
		expect(lensEdgeStroke({ isBroken: false, hasScript: false })).toBe(LENS_STROKE.direct);
	});

	it('draws anything carrying a script in the enhancement colour', () => {
		expect(lensEdgeStroke({ isBroken: false, hasScript: true })).toBe(LENS_STROKE.enhancement);
	});

	// A pair arc is broken only when every binding under it is, so the break is
	// the whole arc's story by then — it outranks the script that carried it.
	it('draws a broken arc in the broken colour, script or not', () => {
		expect(lensEdgeStroke({ isBroken: true, hasScript: false })).toBe(LENS_STROKE.broken);
		expect(lensEdgeStroke({ isBroken: true, hasScript: true })).toBe(LENS_STROKE.broken);
	});

	it('keeps the three kinds distinguishable', () => {
		expect(new Set(Object.values(LENS_STROKE)).size).toBe(3);
	});
});
