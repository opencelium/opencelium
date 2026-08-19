import type { WorkflowUndoChange } from '../types/undoHistory.types';

/**
 * i18n key + interpolation for a change, in the `workflow` namespace.
 *
 * `valueKeys` holds interpolation values that are themselves i18n keys ("Body",
 * "IF", "HTTP Request"): the caller resolves each with `t()` and passes it in
 * under the same variable name. They cannot be baked into the sentence here
 * because the word order around them differs per language.
 */
export const undoChangeLabel = (change: WorkflowUndoChange): {
	key: string;
	values?: Record<string, string | number>;
	valueKeys?: Record<string, string>;
} => {
	switch (change.kind) {
		case 'initial':
			return { key: 'undoHistory.change.initial' };
		case 'nodes-added':
			if (change.nameKey) {
				return { key: 'undoHistory.change.nodeAdded', valueKeys: { name: change.nameKey } };
			}
			return change.name
				? { key: 'undoHistory.change.nodeAdded', values: { name: change.name } }
				: { key: 'undoHistory.change.nodesAdded', values: { count: change.count } };
		case 'nodes-removed':
			if (change.nameKey) {
				return { key: 'undoHistory.change.nodeRemoved', valueKeys: { name: change.nameKey } };
			}
			return change.name
				? { key: 'undoHistory.change.nodeRemoved', values: { name: change.name } }
				: { key: 'undoHistory.change.nodesRemoved', values: { count: change.count } };
		case 'nodes-moved':
			if (change.nameKey) {
				return { key: 'undoHistory.change.nodeMoved', valueKeys: { name: change.nameKey } };
			}
			return change.name
				? { key: 'undoHistory.change.nodeMoved', values: { name: change.name } }
				: { key: 'undoHistory.change.nodesMoved', values: { count: change.count } };
		case 'node-renamed':
			return { key: 'undoHistory.change.changedLabel', values: { label: change.label ?? '' } };
		case 'method-config':
			return { key: 'undoHistory.change.methodConfig', values: { name: change.name ?? '' } };
		case 'method-url':
			return { key: 'undoHistory.change.methodUrl', values: { name: change.name ?? '' } };
		case 'method-header':
			return { key: 'undoHistory.change.methodHeader', values: { name: change.name ?? '' } };
		case 'method-body':
			return { key: 'undoHistory.change.methodBody', values: { name: change.name ?? '' } };
		case 'method-reference':
			return {
				key: change.operation === 'added' ? 'undoHistory.change.referenceAdded'
					: change.operation === 'removed' ? 'undoHistory.change.referenceRemoved'
						: 'undoHistory.change.referenceEdited',
				values: { name: change.name ?? '' },
				valueKeys: { section: `undoHistory.section.${change.section}` },
			};
		case 'method-enhancement':
			// Only the script variant names the section; the rest read the same
			// whichever half of the request they belong to.
			if (change.aspect === 'language') {
				return { key: 'undoHistory.change.enhancementLanguage',
					values: { name: change.name ?? '' } };
			}
			if (change.aspect === 'description') {
				return { key: 'undoHistory.change.enhancementDescription',
					values: { name: change.name ?? '' } };
			}
			if (change.aspect === 'removed') {
				return { key: 'undoHistory.change.enhancementRemoved',
					values: { name: change.name ?? '' } };
			}
			// 'script' and 'multiple' share the generic sentence: it says the
			// enhancement was edited without claiming which part.
			return {
				key: 'undoHistory.change.enhancement',
				values: { name: change.name ?? '' },
				valueKeys: { section: `undoHistory.section.${change.section}` },
			};
		case 'condition-rule':
			return {
				key: change.operation === 'added' ? 'undoHistory.change.conditionAdded'
					: change.operation === 'removed' ? 'undoHistory.change.conditionRemoved'
						: 'undoHistory.change.conditionEdited',
				valueKeys: { operator: `undoHistory.operator.${change.operator}` },
			};
		case 'condition-group':
			return {
				key: change.operation === 'added' ? 'undoHistory.change.groupAdded'
					: change.operation === 'removed' ? 'undoHistory.change.groupRemoved'
						: 'undoHistory.change.groupEdited',
				valueKeys: { operator: `undoHistory.operator.${change.operator}` },
			};
		case 'condition-config':
			return { key: 'undoHistory.change.conditionConfig', values: { name: change.name ?? '' } };
		case 'aggregator-config': {
			const key = change.operation === 'removed'
				? 'undoHistory.change.aggregatorRemoved'
				: 'undoHistory.change.aggregatorConfigured';
			return change.nameKey
				? { key, valueKeys: { name: change.nameKey } }
				: { key, values: { name: change.name ?? '' } };
		}
		case 'connector-config':
			return { key: 'undoHistory.change.connectorConfig', values: { name: change.name ?? '' } };
		case 'operator-edited':
			return {
				key: 'undoHistory.change.operatorEdited',
				valueKeys: { operator: `undoHistory.operator.${change.operator}` },
			};
		case 'edges-changed':
			return { key: 'undoHistory.change.edgesChanged' };
		case 'references':
			return { key: 'undoHistory.change.references' };
		case 'multiple':
			return { key: 'undoHistory.change.multiple' };
		default: {
			const _exhaustive: never = change;
			return _exhaustive;
		}
	}
};
