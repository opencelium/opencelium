import { useCallback, useState } from 'react';
import { createLegacyStore } from '../../../store';
import { removeFieldBinding, setConnection, setFlowchart, upsertFieldBinding } from '../../../store/connection/connectionSlice';
import type { FieldBinding } from '../../../types/connection';
import {
	createTransformationEnhancement, findJsonTransformation, matchTransformations, reconcileTransformationBindings,
	withTransformationInputs, buildTransformationResultVar, type TransformationMap,
} from '../../model/notificationBindings';
import { getTransformationAvailability, toTransformedValue } from '../../model/notificationTransformation';
import {
	locateTransformTarget, transformTargetId, type AnyTransformTarget, type TargetLocation,
} from '../../model/notificationTransformTargets';
import type { NotificationConfig } from '../../model/notification.types';
import { getActiveDraft } from '../../model/notificationConfig';
import { useNotificationReferences } from '../references/notificationReferenceContextValue';

const bindingsOf = (store: ReturnType<typeof createLegacyStore>): FieldBinding[] =>
	store.getState().connection.connection?.fieldBindings ?? [];

/**
 * The dialog's transformations: scripts live in a per-dialog legacy store (as in the binding
 * drawer) so the shared Enhancement editor can edit them, and only reach the page on Apply.
 */
export const useTransformationState = (config: NotificationConfig) => {
	const { connection, currentMethod } = useNotificationReferences();
	const color = currentMethod?.color ?? '';
	const [store] = useState(() => {
		const created = createLegacyStore();
		created.dispatch(setConnection(connection));
		created.dispatch(setFlowchart('workflow-flow'));
		return created;
	});
	const [initialBindings] = useState(() => bindingsOf(store));
	const [transformations, setTransformations] = useState<TransformationMap>(
		() => matchTransformations(config, color, initialBindings));
	const [openEditorId, setOpenEditorId] = useState<string | null>(null);
	const toolId = config.tool;
	const message = getActiveDraft(config)?.message ?? {};

	// Hand-edited JSON is matched by path on every render: the user may type a binding's value
	// away and back, and a transformation made in the editor stays bound once the JSON takes over.
	const getEnhanceId = (target: AnyTransformTarget) => {
		if (!toolId) return undefined;
		return target.kind === 'json'
			? findJsonTransformation(bindingsOf(store), color, target.path)
			: transformations[transformTargetId(toolId, target)];
	};

	const locate = (target: AnyTransformTarget): TargetLocation | null => {
		if (!toolId) return null;
		return target.kind === 'json' ? { kind: 'whole', path: target.path } : locateTransformTarget(toolId, message, target);
	};

	const add = (target: AnyTransformTarget, value: string): string | null => {
		if (!toolId || !color || getTransformationAvailability(value) !== 'ok') return null;
		const location = locate(target);
		if (location?.kind !== 'whole') return null;
		const enhancement = createTransformationEnhancement(buildTransformationResultVar(color, location.path), value);
		store.dispatch(upsertFieldBinding({ enhancement }));
		setTransformations((current) => ({ ...current, [transformTargetId(toolId, target)]: enhancement.enhanceId }));
		setOpenEditorId(enhancement.enhanceId);
		return toTransformedValue(value);
	};

	const remove = (target: AnyTransformTarget) => {
		const enhanceId = getEnhanceId(target);
		if (!toolId || !enhanceId) return;
		store.dispatch(removeFieldBinding({ enhanceId }));
		setTransformations((current) => {
			const next = { ...current };
			delete next[transformTargetId(toolId, target)];
			return next;
		});
	};

	const syncInputs = (target: AnyTransformTarget, value: string) => {
		const enhanceId = getEnhanceId(target);
		const enhancement = bindingsOf(store).find((binding) => binding.enhancement?.enhanceId === enhanceId)?.enhancement;
		if (!enhancement) return;
		store.dispatch(upsertFieldBinding({
			enhancement: withTransformationInputs(enhancement, enhancement.args.RESULT_VAR, value),
		}));
	};

	/** The page's field bindings after Apply, or null when this dialog left them as they were. */
	const collectBindings = useCallback((nextConfig: NotificationConfig): FieldBinding[] | null => {
		const next = reconcileTransformationBindings({ config: nextConfig, color, bindings: bindingsOf(store), transformations });
		return JSON.stringify(next) === JSON.stringify(initialBindings) ? null : next;
	}, [color, initialBindings, store, transformations]);

	return {
		context: {
			store, method: currentMethod, toolId, message, getEnhanceId, locate, add, remove, syncInputs, openEditorId, setOpenEditorId,
		},
		collectBindings,
	};
};
