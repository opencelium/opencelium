import type { Connection, MethodWithId } from '../types/connection';
import {
	flattenReferencePaths,
	getMethodConnectorTitle,
	getResponseSchemaRoot,
	type ReferencePathEntry,
} from '../components/request-editor/body-editor/requestReferenceOptions';
import { getEligibleReferenceMethods, getReferenceMethodLabel }
	from '../components/request-editor/reference-generator/referenceGenerator.utils';
import type { FieldBindingSuggestionRequest, SchemaField } from './fieldBindingSuggestion.types';

/** Target leaves keyed by reference path, so applying a suggestion needs no path parsing. */
export type TargetPathIndex = Map<string, ReferencePathEntry>;

const toWireField = ({ path, kind }: ReferencePathEntry): SchemaField => ({ path, kind });

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
		fields: flattenReferencePaths(getResponseSchemaRoot(source, 'body')).map(toWireField),
	})).filter((source) => source.fields.length > 0),
});
