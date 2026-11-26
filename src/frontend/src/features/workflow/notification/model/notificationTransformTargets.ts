import { getNotificationTool } from '../tools/notificationTools';
import type { NotificationFieldLayout } from '../tools/notificationTool.types';
import { factsValue } from '../tools/toolValues';
import type { NotificationMessageValues, NotificationToolId } from './notification.types';

/** An editor value a transformation can fill: a reference field, or the value of one fact row. */
export type TransformTarget =
	| { kind: 'field'; key: string }
	| { kind: 'fact'; key: string; factId: string };

/** Where the target lands in the generated body, or why a script result cannot fill it. */
export type TargetLocation =
	| { kind: 'whole'; path: string[] }
	| { kind: 'combined' }
	| { kind: 'unused' };

/** Keyed by tool too: Slack and Teams both have a `text` field, and each tool keeps its own draft. */
export const transformTargetId = (toolId: NotificationToolId, target: TransformTarget) => target.kind === 'field'
	? `${toolId}:field:${target.key}`
	: `${toolId}:fact:${target.key}:${target.factId}`;

const flattenFields = (layout: NotificationFieldLayout[]) =>
	layout.flatMap((item) => item.kind === 'row' ? item.fields : [item]);

export const listTransformTargets = (toolId: NotificationToolId, message: NotificationMessageValues): TransformTarget[] =>
	flattenFields(getNotificationTool(toolId).fields).flatMap((field): TransformTarget[] => {
		switch (field.kind) {
			case 'line':
			case 'area':
				return [{ kind: 'field', key: field.key }];
			case 'facts':
				return factsValue(message, field.key).map((fact) => ({ kind: 'fact', key: field.key, factId: fact.id }));
			case 'text':
			case 'select':
			case 'toggle':
				return [];
			default: {
				const _exhaustive: never = field;
				return _exhaustive;
			}
		}
	});

export const readTargetValue = (message: NotificationMessageValues, target: TransformTarget): string => {
	if (target.kind === 'fact') return factsValue(message, target.key).find((fact) => fact.id === target.factId)?.value ?? '';
	const value = message[target.key];
	return typeof value === 'string' ? value : '';
};

export const writeTargetValue = (
	message: NotificationMessageValues,
	target: TransformTarget,
	value: string,
): NotificationMessageValues => target.kind === 'field'
	? { ...message, [target.key]: value }
	: { ...message, [target.key]: factsValue(message, target.key)
		.map((fact) => fact.id === target.factId ? { ...fact, value } : fact) };

// Not whitespace, so the tools' trimming leaves it intact, and never typed by a user.
const SENTINEL = '\u0000oc-transform-target\u0000';

const findSentinel = (value: unknown, path: string[]): TargetLocation | null => {
	if (typeof value === 'string') {
		if (value === SENTINEL) return { kind: 'whole', path };
		return value.includes(SENTINEL) ? { kind: 'combined' } : null;
	}
	const entries = Array.isArray(value) ? value.map((item, index) => [String(index), item] as const)
		: value && typeof value === 'object' ? Object.entries(value) : [];
	for (const [key, nested] of entries) {
		const found = findSentinel(nested, [...path, key]);
		if (found) return found;
	}
	return null;
};

/**
 * The backend binds a script result to a whole JSON value (BindingUtility.doWithBody), so only a
 * target the tool copies verbatim into one string can hold a transformation. Found by building the
 * body with a marker in place of the target's value.
 */
export const locateTransformTarget = (
	toolId: NotificationToolId,
	message: NotificationMessageValues,
	target: TransformTarget,
): TargetLocation => {
	const body = getNotificationTool(toolId).buildBody(writeTargetValue(message, target, SENTINEL));
	return findSentinel(body, []) ?? { kind: 'unused' };
};
