import { store } from '@app/store/store';
import { logsApi } from '../api/logsApi';
import type { DetailedMethodLog, FlowchartChildLog, FlowchartLog, FlowchartProperty } from './types';

export type ExecutionPlaygroundLocation = {
	executionId: string;
	indexPath: string;
	loopIndex: string;
	direction: FlowchartProperty['DIRECTION'];
	elementId: string;
};

export function executionPlaygroundSearch(location: ExecutionPlaygroundLocation): string {
	return new URLSearchParams({
		playground: location.indexPath, execution: location.executionId,
		loop: location.loopIndex, direction: location.direction, element: location.elementId,
	}).toString();
}

const EXECUTION_PLAYGROUND_PARAMS = ['playground', 'execution', 'loop', 'direction', 'element'];

// The search without the execution playground parameters, `?`-prefixed when anything is left.
export function withoutExecutionPlaygroundSearch(search: string): string {
	const params = new URLSearchParams(search);
	EXECUTION_PLAYGROUND_PARAMS.forEach((name) => params.delete(name));
	const rest = params.toString();
	return rest ? `?${rest}` : '';
}

export function readExecutionPlaygroundSearch(search: URLSearchParams): ExecutionPlaygroundLocation | null {
	const indexPath = search.get('playground') ?? '';
	const executionId = search.get('execution') ?? '';
	const loopIndex = search.get('loop') ?? '';
	const direction = search.get('direction');
	const elementId = search.get('element') ?? '';
	if (!/^\d+(?:_\d+)*$/.test(indexPath) || !/^[\w-]+$/.test(executionId)
		|| !/^[\w-]+$/.test(elementId) || !/^(?:\d+(?:,\d+)*)?$/.test(loopIndex)
		|| (direction !== 'source' && direction !== 'target')) return null;
	return { executionId, indexPath, loopIndex, direction, elementId };
}

export type LoggedExecution = {
	location: ExecutionPlaygroundLocation;
	method: DetailedMethodLog;
	connectorId: string | undefined;
	hasTargetFlowchart?: boolean;
	methodLocations?: ReadonlyMap<string, { indexPath: string; direction: FlowchartProperty['DIRECTION'] }>;
	findMethod: (indexPath: string, direction?: FlowchartProperty['DIRECTION']) => Promise<DetailedMethodLog | null>;
	iteratorIndex: (name: string) => number | null;
};

const queryOptions = { subscribe: false };

export async function loadLoggedExecution(location: ExecutionPlaygroundLocation, connectionId: number | null): Promise<LoggedExecution | null> {
	const roots: FlowchartLog[] = await store.dispatch(logsApi.endpoints.getExecutionConnectors.initiate(location.executionId, queryOptions)).unwrap();
	const root = roots.find(({ properties }) => properties.DIRECTION === location.direction);
	if (!root || (connectionId !== null && root.connectionId != null && Number(root.connectionId) !== connectionId)) return null;

	const rootId = root.id;
	const childrenByParent = new Map<string, Promise<FlowchartChildLog[]>>();
	const getChildren = (id: string, loopIndex?: number): Promise<FlowchartChildLog[]> => {
		const key = `${id}:${loopIndex ?? ''}`;
		const pending = childrenByParent.get(key);
		if (pending) return pending;
		const request = store.dispatch(logsApi.endpoints.getElementChildren.initiate({ id, loopIndex }, queryOptions)).unwrap();
		childrenByParent.set(key, request);
		return request;
	};

	const loopSelections = new Map<string, number>();
	const iteratorIndices = new Map<string, number>();
	const selectedIterations = location.loopIndex ? location.loopIndex.split(',').map(Number) : [];

	async function findElement(indexPath: string, flowchartId: string, captureSelection = false, before?: number | null) {
		const segments = indexPath.split('_');
		let children = await getChildren(flowchartId);
		let selectionIndex = 0;
		for (let depth = 1; depth <= segments.length; depth += 1) {
			const path = segments.slice(0, depth).join('_');
			const candidates = children.filter((child) => child.indexPath === path
				&& (before == null || child.startOffset == null || child.startOffset < before));
			const element = captureSelection
				? candidates.find((child) => depth < segments.length || child.id === location.elementId)
				: candidates.at(-1);
			if (!element) return null;
			if (depth === segments.length) {
				const matchesSelection = !captureSelection || selectionIndex === selectedIterations.length;
				return matchesSelection && element.type === 'OPERATION' ? element : null;
			}
			if (element.type === 'IF') {
				children = await getChildren(element.id);
			} else if (element.type === 'LOOP') {
				const iteration = captureSelection ? selectedIterations[selectionIndex++]
					: (flowchartId === rootId ? loopSelections.get(path) : undefined) ?? element.properties.size - 1;
				if (!Number.isSafeInteger(iteration) || iteration < 0) return null;
				if (captureSelection) {
					loopSelections.set(path, iteration);
					iteratorIndices.set(element.properties.iterator, iteration);
				}
				children = await getChildren(element.id, iteration);
			} else return null;
		}
		return null;
	}

	const target = await findElement(location.indexPath, rootId, true);
	if (!target || target.id !== location.elementId) return null;
	const detailsById = new Map<string, Promise<DetailedMethodLog>>();
	const getDetails = (id: string) => {
		const pending = detailsById.get(id);
		if (pending) return pending;
		const request = store.dispatch(logsApi.endpoints.getMethodDetails.initiate(id, queryOptions)).unwrap();
		detailsById.set(id, request);
		return request;
	};
	const method = await getDetails(target.id);
	return {
		location, method, connectorId: root.properties.CONNECTOR_ID,
		hasTargetFlowchart: roots.some(({ properties }) => properties.DIRECTION === 'target'),
		iteratorIndex: (name) => iteratorIndices.get(name) ?? null,
		findMethod: async (indexPath, direction = location.direction) => {
			const flowchart = roots.find(({ properties }) => properties.DIRECTION === direction);
			if (!flowchart) return null;
			const element = await findElement(indexPath, flowchart.id, false, target.startOffset);
			return element && element.id !== target.id ? getDetails(element.id) : null;
		},
	};
}
