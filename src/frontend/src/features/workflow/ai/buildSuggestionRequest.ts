import type { Connection, MethodWithId } from '../types/connection';
import {
	flattenReferencePaths,
	getMethodConnectorTitle,
	getResponseSchemaRoot,
	type ArrayAccessor,
	type ReferencePathEntry,
} from '../components/request-editor/body-editor/requestReferenceOptions';
import { buildIteratorAccessors, iteratorKey } from './loopIterators';
import { getEligibleReferenceMethods, getReferenceMethodLabel }
	from '../components/request-editor/reference-generator/referenceGenerator.utils';
import type { FieldBindingSuggestionRequest, SchemaField } from './fieldBindingSuggestion.types';

/** Target leaves keyed by reference path, so applying a suggestion needs no path parsing. */
export type TargetPathIndex = Map<string, ReferencePathEntry>;

const toWireField = ({ path, kind }: ReferencePathEntry): SchemaField => ({ path, kind });

/**
 * An array walked by an enclosing loop is referenced through that loop's iterator, so the
 * suggestion reads the element of the current iteration rather than always the first.
 */
const iteratorAccessorFor = (
	accessors: Map<string, string>,
	sourceColor: string,
): ArrayAccessor => (path) => accessors.get(iteratorKey(sourceColor, path)) ?? '0';

export const buildTargetPathIndex = (method: MethodWithId): TargetPathIndex =>
	new Map(flattenReferencePaths(method.request.body?.fields).map((entry) => [entry.path, entry]));

/**
 * Assembles the suggester payload for one method's request body: the leaves it needs
 * filled, and the response leaves of every method that is allowed to feed it. Eligibility
 * is the reference picker's own rule, so the suggester can never propose a reference the
 * user could not have picked by hand.
 */
export const buildSuggestionRequest = (
	connection: Connection | null,
	method: MethodWithId,
	targetPaths: TargetPathIndex,
): FieldBindingSuggestionRequest => ({
	target: {
		label: getReferenceMethodLabel(method),
		connectorTitle: getMethodConnectorTitle(method),
		fields: [...targetPaths.values()].map(toWireField),
	},
	sources: getEligibleReferenceMethods(connection, method).map((source) => ({
		color: source.color,
		label: getReferenceMethodLabel(source),
		connectorTitle: getMethodConnectorTitle(source),
		fields: flattenReferencePaths(
			getResponseSchemaRoot(source, 'body'),
			iteratorAccessorFor(buildIteratorAccessors(connection, method), source.color),
		).map(toWireField),
	})).filter((source) => source.fields.length > 0),
});
