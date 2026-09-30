import type { MinimapRect } from './minimap.model';

/** A view box in flow units, plus how many flow units one screen pixel of the map spans. */
export type MinimapViewBox = MinimapRect & { unitsPerPx: number };

/** Room around the outermost dot so its ring is not clipped by the frame, in map pixels. */
const EDGE_PADDING_PX = 14;

export const flowViewRect = (
	[translateX, translateY, zoom]: readonly [number, number, number],
	width: number,
	height: number,
): MinimapRect => ({ x: -translateX / zoom, y: -translateY / zoom, width: width / zoom, height: height / zoom });

const union = (a: MinimapRect, b: MinimapRect): MinimapRect => {
	const x = Math.min(a.x, b.x);
	const y = Math.min(a.y, b.y);
	return { x, y, width: Math.max(a.x + a.width, b.x + b.width) - x, height: Math.max(a.y + a.height, b.y + b.height) - y };
};

/**
 * Fits the graph and the visible area into a map of the given pixel size with one
 * uniform scale, centred on the spare axis — so circles stay round and the
 * viewport rectangle keeps the canvas' own proportions.
 */
export const fitViewBox = (
	graph: MinimapRect | null,
	view: MinimapRect,
	mapWidth: number,
	mapHeight: number,
): MinimapViewBox => {
	const content = graph ? union(graph, view) : view;
	const innerWidth = Math.max(mapWidth - EDGE_PADDING_PX * 2, 1);
	const innerHeight = Math.max(mapHeight - EDGE_PADDING_PX * 2, 1);
	const unitsPerPx = Math.max(content.width / innerWidth, content.height / innerHeight, Number.EPSILON);
	const width = mapWidth * unitsPerPx;
	const height = mapHeight * unitsPerPx;
	return {
		x: content.x + content.width / 2 - width / 2,
		y: content.y + content.height / 2 - height / 2,
		width,
		height,
		unitsPerPx,
	};
};

export const contains = (rect: MinimapRect, x: number, y: number) =>
	x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
