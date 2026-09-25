import React from 'react';
import ReactJson from 'react-json-view';
import { useTheme } from '@shared/theme/hooks/useTheme';
import { getJsonReferenceField } from '../../body-editor/bodyJsonHooks';
import { setLastBodyReferenceTriggerRect } from '../../body-editor/InlineBodyReferenceEditor/InlineBodyReferenceEditor';
import type { useRequestObjectEditor } from '../useRequestObjectEditor';
import type { JsonExtensionComponent, LegacyRequestJsonEditorProps } from './LegacyRequestJsonEditor.types';

type Props = LegacyRequestJsonEditorProps & {
	editor: ReturnType<typeof useRequestObjectEditor>;
	pointerComponent: JsonExtensionComponent;
	webhookComponent: JsonExtensionComponent;
	referenceComponent: JsonExtensionComponent;
};

const PatchedReactJson = ReactJson as unknown as React.ComponentType<Record<string, unknown>>;

export function LegacyRequestData({ messageProperty, source, readOnly, editor,
	pointerComponent, webhookComponent, referenceComponent }: Props) {
	const { themeMode } = useTheme();
	return <div className='bodyLegacyJsonWrap' data-testid={`workflow-request-${messageProperty}`}
		onMouseDownCapture={(event) => {
			const trigger = (event.target as HTMLElement | null)?.closest('.click-to-reference') as HTMLElement | null;
			if (!trigger) return;
			const row = trigger.closest('.variable-row, .object-key-val') as HTMLElement | null || trigger;
			const container = trigger.closest('.bodyLegacyLeft, .bodyLegacyJsonWrap') as HTMLElement | null;
			const rect = row.getBoundingClientRect();
			const containerRect = container?.getBoundingClientRect();
			setLastBodyReferenceTriggerRect({ left: rect.left, top: rect.top, width: rect.width,
				height: rect.height, containerLeft: containerRect?.left,
				containerRight: containerRect?.right });
		}}>
		<PatchedReactJson name={false} collapsed={false} src={source} onSelect={editor.onSelect}
			onEdit={readOnly ? false : editor.syncSource} onDelete={readOnly ? false : editor.syncSource}
			onAdd={readOnly ? false : editor.syncSource} PointerComponent={pointerComponent}
			ReferenceComponent={referenceComponent} WebhookComponent={webhookComponent}
			onReferenceClick={(_event: unknown, data: Record<string, unknown>) => {
				const field = getJsonReferenceField(data);
				if (field) editor.selectField(field.namespace, field.name, field.value);
			}}
			theme={themeMode === 'dark' ? 'twilight' : 'rjv-default'}
			style={{ wordBreak: 'break-word', padding: '8px 0', background: 'transparent', fontSize: 13 }} />
	</div>;
}
