import { normalizePayloadColor } from '@features/workflow/api/connectionPayload.references';
import { removeDeletedRequestBindings, updateRequestFieldBindings } from '@features/workflow/components/request-editor/body-editor/bodyBindingMutations';
import type { FieldBinding } from '@features/workflow/types/connection';
import type { WorkflowMethodConfig } from '@features/workflow/types/request-config.types';

type Leaf = { namespace: string[]; name: string; value: unknown };

// Walks a body the way the body editor names its fields: array items by index, nested names as the namespace.
function leaves(value: unknown, namespace: string[] = [], name = ''): Leaf[] {
	const inner = [...namespace, name].filter(Boolean);
	if (Array.isArray(value)) return value.flatMap((item, index) => leaves(item, inner, String(index)));
	if (value && typeof value === 'object') {
		return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => leaves(nested, inner, key));
	}
	return name ? [{ namespace, name, value }] : [];
}

const leafKey = ({ namespace, name }: Leaf) => [...namespace, name].join('\u0000');

/**
 * The field bindings after a fix: a reference in the body or a header lives twice, as the value and as the binding
 * the reference info, the variables and the run read, so every field the fix changed gets its binding rebuilt
 * (keeping its script), and bindings of fields that are gone are dropped.
 */
export function applyFixToBindings(fieldBindings: FieldBinding[], color: string, before: WorkflowMethodConfig,
	after: Pick<WorkflowMethodConfig, 'body' | 'headers'>): FieldBinding[] {
	const methodColor = normalizePayloadColor(color, '');
	let next = { fieldBindings };
	const sync = (messageProperty: 'body' | 'header', previous: unknown, current: unknown) => {
		const had = new Map(leaves(previous).map((leaf) => [leafKey(leaf), leaf.value]));
		for (const leaf of leaves(current)) {
			if (had.get(leafKey(leaf)) === leaf.value) continue;
			next = updateRequestFieldBindings(next, methodColor, messageProperty, { namespace: leaf.namespace, name: leaf.name, newValue: leaf.value });
		}
		next = removeDeletedRequestBindings(next, methodColor, messageProperty, current);
	};
	sync('body', before.body, after.body);
	sync('header', before.headers, after.headers);
	return next.fieldBindings;
}
