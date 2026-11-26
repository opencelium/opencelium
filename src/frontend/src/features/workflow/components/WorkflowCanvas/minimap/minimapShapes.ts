export const diamondPath = (x: number, y: number, r: number) =>
	`M ${x} ${y - r} L ${x + r} ${y} L ${x} ${y + r} L ${x - r} ${y} Z`;

const point = (x: number, y: number, r: number, px: number, py: number) => `${x + px * r} ${y + py * r}`;

/** A bell in a box of ±r: dome, flared rim, and the clapper as a second subpath below it. */
export const bellPath = (x: number, y: number, r: number) => {
	const p = (px: number, py: number) => point(x, y, r, px, py);
	const clapper = 0.2 * r;
	return [
		`M ${p(0, -1)}`,
		`C ${p(0.45, -1)} ${p(0.6, -0.65)} ${p(0.6, -0.25)}`,
		`L ${p(0.6, 0.2)} L ${p(0.95, 0.55)} L ${p(-0.95, 0.55)} L ${p(-0.6, 0.2)} L ${p(-0.6, -0.25)}`,
		`C ${p(-0.6, -0.65)} ${p(-0.45, -1)} ${p(0, -1)} Z`,
		`M ${p(-0.2, 0.78)} a ${clapper} ${clapper} 0 1 0 ${2 * clapper} 0 a ${clapper} ${clapper} 0 1 0 ${-2 * clapper} 0 Z`,
	].join(' ');
};
