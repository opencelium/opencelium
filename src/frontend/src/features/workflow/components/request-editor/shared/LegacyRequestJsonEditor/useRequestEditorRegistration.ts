import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { collectMappingTargets } from '@features/ai-assistant/mapping/mappingCandidates';
import { requestEditorBridgeStore } from '@features/workflow/command/requestEditorBridge';
import { updateConnection } from '../../../../store/connection/connectionSlice';
import type { MethodWithId } from '../../../../types/connection';
import { createDirectReferenceEnhancement, findRequestEnhancement } from '../../body-editor/bodyBinding';
import type { RequestMessageProperty } from '../../body-editor/bodyBinding.types';
import type { useRequestObjectEditor } from '../useRequestObjectEditor';

type Params = {
	editor: ReturnType<typeof useRequestObjectEditor>;
	method: MethodWithId;
	messageProperty: RequestMessageProperty;
	source: unknown;
	readOnly?: boolean;
};

/**
 * Makes this body or header editor the one a spoken request ("apply transformation for Vendor with upper case") works
 * on, while it is open and editable. Read through a ref, so a request sees the fields as they are when it arrives.
 */
export function useRequestEditorRegistration({ editor, method, messageProperty, source, readOnly }: Params) {
	const dispatch = useDispatch();
	const latest = useRef({ editor, method, source });
	useEffect(() => {
		latest.current = { editor, method, source };
	});

	useEffect(() => {
		if (readOnly) return undefined;
		return requestEditorBridgeStore.getState().register({
			methodId: latest.current.method.id,
			methodLabel: latest.current.method.label || latest.current.method.name,
			messageProperty,
			fieldPaths: () => collectMappingTargets(latest.current.source).map((target) => target.path),
			selectedFieldPath: () => {
				const { selection } = latest.current.editor;
				if (!selection) return null;
				return collectMappingTargets(latest.current.source).find((target) => target.name === selection.name
					&& target.namespace.join('.') === selection.namespace.join('.'))?.path ?? null;
			},
			openTransformation: (path) => {
				const { editor: current, method: owner, source: body } = latest.current;
				const target = collectMappingTargets(body).find((candidate) => candidate.path === path);
				if (!target || !current.connection) return { kind: 'unknown-field' };
				const existing = findRequestEnhancement(current.connection, owner.color, target.namespace, target.name,
					messageProperty, target.current);
				if (existing) {
					current.selectField(target.namespace, target.name, target.current);
					return { kind: 'opened', enhanceId: existing.enhanceId };
				}
				// As the transformation panel's "create" does for a field that holds a reference.
				const created = createDirectReferenceEnhancement(current.connection, owner.color, messageProperty,
					target.namespace, target.name, target.current);
				if (!created) return { kind: 'no-reference' };
				dispatch(updateConnection({ fieldBindings: created.connection.fieldBindings } as never));
				current.selectField(target.namespace, target.name, target.current);
				return { kind: 'opened', enhanceId: created.enhanceId };
			},
		});
	}, [dispatch, messageProperty, readOnly]);
}
