// The dipped arc is only for a *pair* arc, which shares its two nodes with the
// control-flow edge between them: it leaves the provider's bottom handle, bows
// below the row and arrives at the consumer's left handle, so a binding never
// hides behind that edge. Field arcs land on card rows, where no flow edge runs,
// and use xyflow's own bezier instead (see BindingLensEdge).
const ARC_MIN_DIP = 40;
const ARC_MAX_DIP = 160;

export type ArcGeometry = {
	path: string;
	labelX: number;
	labelY: number;
};

export const buildDippedArc = (
	sourceX: number,
	sourceY: number,
	targetX: number,
	targetY: number,
): ArcGeometry => {
	const dip = Math.min(ARC_MAX_DIP,
		Math.max(ARC_MIN_DIP, Math.hypot(targetX - sourceX, targetY - sourceY) * 0.28));
	const controlX = (sourceX + targetX) / 2;
	const controlY = Math.max(sourceY, targetY) + dip;

	return {
		path: `M ${sourceX},${sourceY} Q ${controlX},${controlY} ${targetX},${targetY}`,
		// The quadratic at t = 0.5: the curve's midpoint, so a label sits on the arc
		// rather than beside it. Not its lowest point unless the two ends are level —
		// a label wants the middle of the line, not its extreme.
		labelX: (sourceX + 2 * controlX + targetX) / 4,
		labelY: (sourceY + 2 * controlY + targetY) / 4,
	};
};
