import { describe, expect, it } from 'vitest';
import { buildDippedArc } from './bindingLensArc';

// B(t) for the quadratic the arc is drawn with, read back out of the path so the
// test cannot drift from what is rendered.
const pointAt = (path: string, t: number) => {
	const [, sx, sy, cx, cy, tx, ty] = path
		.match(/^M ([\d.-]+),([\d.-]+) Q ([\d.-]+),([\d.-]+) ([\d.-]+),([\d.-]+)$/)!
		.map(Number);
	const axis = (p0: number, p1: number, p2: number) =>
		(1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t ** 2 * p2;
	return { x: axis(sx, cx, tx), y: axis(sy, cy, ty) };
};

describe('buildDippedArc', () => {
	// node.position is the centre of the 62px circle, so a bottom handle sits 31px
	// below it and a left handle 31px to the left of the next node's centre.
	const cases: Record<string, [number, number, number, number]> = {
		'same row, 300px apart': [0, 131, 269, 100],
		'level ends': [0, 200, 240, 200],
		'consumer below': [0, 131, 269, 300],
		'backwards (out-of-scope provider runs later)': [600, 131, 269, 100],
		'far apart, dip clamped': [0, 131, 1200, 100],
	};

	it.each(Object.entries(cases))('puts the label on the curve — %s', (_name, coords) => {
		const arc = buildDippedArc(...coords);
		const middle = pointAt(arc.path, 0.5);
		expect(arc.labelX).toBeCloseTo(middle.x, 6);
		expect(arc.labelY).toBeCloseTo(middle.y, 6);
	});

	it('bows below both ends, whichever is lower', () => {
		const arc = buildDippedArc(0, 131, 269, 300);
		const lowest = Math.max(
			...Array.from({ length: 21 }, (_, step) => pointAt(arc.path, step / 20).y));
		expect(lowest).toBeGreaterThan(300);
	});

	it('clamps the dip so neither a tiny nor a huge span misshapes the arc', () => {
		const tiny = pointAt(buildDippedArc(0, 0, 10, 0).path, 0.5).y;
		const huge = pointAt(buildDippedArc(0, 0, 4000, 0).path, 0.5).y;
		// half of the 40px floor and the 160px ceiling: the label rides the curve,
		// which reaches half way to the control point at t = 0.5
		expect(tiny).toBeCloseTo(20, 6);
		expect(huge).toBeCloseTo(80, 6);
	});
});
