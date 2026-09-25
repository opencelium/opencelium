import { useCallback, useMemo } from 'react';
import { BodyPointer } from '../../body-editor/BodyPointer/BodyPointer';
import { BodyWebhookReference } from '../../body-editor/BodyWebhookReference/BodyWebhookReference';
import { InlineBodyReferenceEditor } from '../../body-editor/InlineBodyReferenceEditor/InlineBodyReferenceEditor';
import { extractWebhookValue } from '../../body-editor/bodyWebhook';
import { splitReferences } from '../../body-editor/bodyReference';
import type { useRequestObjectEditor } from '../useRequestObjectEditor';
import type { LegacyRequestJsonEditorProps } from './LegacyRequestJsonEditor.types';
import { findReferencedField, isString, removeWebhookSnippet } from './legacyRequestJsonEditor.utils';

type Params = LegacyRequestJsonEditorProps & {
	methodId: string;
	editor: ReturnType<typeof useRequestObjectEditor>;
};

export function useLegacyJsonComponents({ messageProperty, source, readOnly,
	methodId, editor }: Params) {
	const updateReferencedField = useCallback((matcher: (value: string) => string | null) => {
		const match = findReferencedField(source, matcher);
		if (!match) return;
		editor.syncSource({ updated_src: match.updatedSource, existing_src: source,
			namespace: match.namespace, name: match.name, existing_value: match.existingValue,
			new_value: match.newValue });
	}, [editor, source]);
	const removePointer = useCallback((pointer: string, pointers: string[]) => {
		const target = pointers.map((item) => item.trim()).filter(Boolean);
		updateReferencedField((value) => {
			const refs = splitReferences(value);
			if (refs.length !== target.length || !refs.every((item, index) => item === target[index])) return null;
			const index = refs.findIndex((item) => item === pointer);
			return index < 0 ? null : refs.filter((_, itemIndex) => itemIndex !== index).join(';');
		});
	}, [updateReferencedField]);
	const editPointer = useCallback((pointer: string, pointers: string[], reference: string) => {
		const target = pointers.map((item) => item.trim()).filter(Boolean);
		updateReferencedField((value) => {
			const refs = splitReferences(value);
			if (refs.length !== target.length || !refs.every((item, index) => item === target[index])) return null;
			const index = refs.findIndex((item) => item === pointer);
			return index < 0 ? null : refs.map((item, itemIndex) => itemIndex === index ? reference : item).join(';');
		});
	}, [updateReferencedField]);
	const pointerComponent = useMemo(() => ({ id: `${methodId}_${messageProperty}_pointer`,
		getComponent: (params: Record<string, unknown>) => <BodyPointer
			pointer={String(params.pointer || '')}
			pointers={Array.isArray(params.pointers) ? params.pointers.filter(isString) : []}
			submitEdit={params.submitEdit as (() => void) | undefined}
			onClick={params.onClick as ((event?: unknown) => void) | undefined}
			onRemove={removePointer} onEdit={readOnly ? undefined : editPointer}
			connection={readOnly ? undefined : editor.connection ?? undefined}
			currentMethod={readOnly ? undefined : editor.method} /> }),
		[editor.connection, editor.method, editPointer, messageProperty, methodId, readOnly, removePointer]);
	const webhookComponent = useMemo(() => ({ id: `${methodId}_${messageProperty}_webhook`,
		getComponent: (params: Record<string, unknown>) => <BodyWebhookReference
			webhook={extractWebhookValue(String(params.webhook || ''))}
			onRemove={(webhook) => updateReferencedField((value) => removeWebhookSnippet(value, webhook))} /> }),
		[messageProperty, methodId, updateReferencedField]);
	const referenceComponent = useMemo(() => ({ id: `${methodId}_${messageProperty}_reference`,
		self: { current: {} }, getComponent: (params: Record<string, unknown>) => {
			if (!editor.connection) return null;
			const meta = params.ReferenceComponent as { self?: { current?: unknown } } | undefined;
			if (meta?.self) meta.self.current = true;
			return <InlineBodyReferenceEditor referenceId={`${methodId}_${messageProperty}_reference`}
				connection={editor.connection} currentMethod={editor.method}
				submitEdit={params.submitEdit as () => void}
				onClose={params.editCancel as (() => void) | undefined} />;
		} }), [editor.connection, editor.method, messageProperty, methodId]);
	return { pointerComponent, webhookComponent, referenceComponent };
}
