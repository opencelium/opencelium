import { describe, expect, it } from 'vitest';
import { EMPTY_LIVE_LOG_TREE, type LiveLogNode, type LiveLogTree } from '@features/logs';
import { countSteps } from './testRunSteps';

const node = (indexPath: string, type: LiveLogNode['type'], status: LiveLogNode['status'], loopIndex = ''): LiveLogNode => ({
	key: `${indexPath}@${loopIndex}`, id: '', indexPath, loopIndex, type, status, connectorName: null, properties: {}, segment: {},
	error: null, childKeys: [], storedIteration: null, latestIteration: null, iterationCount: 0,
});

const treeOf = (nodes: LiveLogNode[], errorLocations: LiveLogTree['errorLocations'] = []): LiveLogTree =>
	({ ...EMPTY_LIVE_LOG_TREE, nodes: Object.fromEntries(nodes.map((item) => [item.key, item])), errorLocations });

describe('countSteps', () => {
	it('counts the method steps reached and failed, by position, not per loop iteration', () => {
		const tree = treeOf([node('0', 'OPERATION', 'COMPLETE'), node('1', 'LOOP', 'FAIL'),
			node('1_0', 'OPERATION', 'COMPLETE', '0'), node('1_0', 'OPERATION', 'FAIL', '1')]);
		expect(countSteps(tree)).toEqual({ total: 2, failed: 1 });
	});

	it('counts a failure in a loop iteration that is not kept locally through the error locations', () => {
		const tree = treeOf([node('0', 'OPERATION', 'COMPLETE'), node('1_0', 'OPERATION', 'COMPLETE', '0')],
			[{ indexPath: '1_0', loopIndex: '4' }]);
		expect(countSteps(tree)).toEqual({ total: 2, failed: 1 });
	});
});
