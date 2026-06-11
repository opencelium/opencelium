import { useMemo } from 'react';
import { ConfigProvider } from 'antd';
import { useMethodContext } from '../../../providers/MethodContext';
import { useTheme } from '@shared/theme/hooks/useTheme';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useRequestObjectEditor } from './useRequestObjectEditor';
import ReferenceEnhancement from '../enhancement/Enhancement';
import ReactJson from 'react-json-view';
import { Splitter } from '@shared/ui/primitives/Splitter';
import { Collapse } from '@shared/ui/primitives/Collapse';
import type { CollapseItem } from '@shared/ui/primitives/Collapse/Collapse.types';
import { Empty } from '@shared/ui/primitives/Empty';
import { ReferenceInfo } from '../reference-info/ReferenceInfo';
import { splitReferences } from '../body-editor/bodyReference';
import { setBodySelectionValue } from '../body-editor/bodyValue';
import { BodyPointer } from '../body-editor/BodyPointer';
import { BodyWebhookReference } from '../body-editor/BodyWebhookReference';
import { getJsonReferenceField } from '../body-editor/bodyJsonHooks';
import { extractWebhookValue, webhookSnippet } from '../body-editor/bodyWebhook';
import { InlineBodyReferenceEditor, setLastBodyReferenceTriggerRect } from '../body-editor/InlineBodyReferenceEditor';
import '../body-editor/bodyLegacy.css';

const isString = (value: unknown): value is string => typeof value === 'string';

const removeWebhookSnippet = (value: string, webhook: string) => {
  const snippet = webhookSnippet(webhook);
  const current = String(value || '');
  const parts = current
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);

  const nextParts = parts.filter((item) => item !== snippet);
  if (nextParts.length !== parts.length) return nextParts.join(';');

  if (current.includes(snippet)) {
    return current
      .replace(snippet, '')
      .replace(/\s*;\s*;\s*/g, '; ')
      .replace(/^\s*;\s*|\s*;\s*$/g, '')
      .trim();
  }

  const extracted = extractWebhookValue(current);
  if (extracted === webhook) return '';

  return null;
};

type Props = {
  messageProperty: 'body' | 'header';
  source: Record<string, unknown>;
  readOnly?: boolean;
};

export function LegacyRequestJsonEditor({ messageProperty, source, readOnly }: Props) {
  const { method } = useMethodContext();
  const { themeMode } = useTheme();
  const { t } = useI18n('workflow');
  const editor = useRequestObjectEditor({ messageProperty, source });
  const hasReferenceInfo = !!editor.connection?.fieldBindings.some((binding) => {
    const result = binding.enhancement?.args?.RESULT_VAR;
    return typeof result === 'string' && result.startsWith(`${method.color}.(request).${messageProperty}.$`);
  });
  const PatchedReactJson = ReactJson as unknown as React.ComponentType<Record<string, unknown>>;

  const updateReferencedField = (matcher: (value: string) => string | null) => {
    const findField = (value: unknown, namespace: string[] = [], name?: string): {
      namespace: string[];
      name: string;
      existingValue: string;
      newValue: string;
      updatedSource: Record<string, unknown>;
    } | null => {
      if (typeof value === 'string' && name) {
        const nextValue = matcher(value);
        if (nextValue !== null) {
          return {
            namespace,
            name,
            existingValue: value,
            newValue: nextValue,
            updatedSource: setBodySelectionValue(source, { namespace, name, value, pathLabel: [...namespace, name].join('.') }, nextValue),
          };
        }
      }
      if (Array.isArray(value)) {
        for (let index = 0; index < value.length; index += 1) {
          const found = findField(value[index], [...namespace, name].filter(isString), String(index));
          if (found) return found;
        }
        return null;
      }
      if (value && typeof value === 'object') {
        for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
          const found = findField(nested, [...namespace, name].filter(isString), key);
          if (found) return found;
        }
      }
      return null;
    };

    const match = findField(source);
    if (!match) return;
    editor.syncSource({
      updated_src: match.updatedSource,
      existing_src: source,
      namespace: match.namespace,
      name: match.name,
      existing_value: match.existingValue,
      new_value: match.newValue,
    });
  };

  const removePointer = (pointer: string, pointers: string[]) => {
    const targetPointers = pointers.map((item) => item.trim()).filter(Boolean);
    updateReferencedField((value) => {
      const refs = splitReferences(value);
      const sameField = refs.length === targetPointers.length && refs.every((item, index) => item === targetPointers[index]);
      if (!(sameField && refs.includes(pointer))) return null;
      const indexToRemove = refs.findIndex((item) => item === pointer);
      if (indexToRemove === -1) return null;
      return refs.filter((_, index) => index !== indexToRemove).join(';');
    });
  };

  const pointerComponent = useMemo(() => ({
    id: `${method.id}_${messageProperty}_pointer`,
    getComponent: (params: Record<string, unknown>) => (
      <BodyPointer
        pointer={String(params.pointer || '')}
        pointers={Array.isArray(params.pointers) ? params.pointers.filter(isString) : []}
        submitEdit={params.submitEdit as (() => void) | undefined}
        onClick={params.onClick as ((event?: unknown) => void) | undefined}
        onRemove={removePointer}
      />
    ),
  }), [messageProperty, method.id, removePointer]);

  const webhookComponent = useMemo(() => ({
    id: `${method.id}_${messageProperty}_webhook`,
    getComponent: (params: Record<string, unknown>) => (
      <BodyWebhookReference
        webhook={extractWebhookValue(String(params.webhook || ''))}
        onRemove={(webhook) => updateReferencedField((value) => removeWebhookSnippet(value, webhook))}
      />
    ),
  }), [messageProperty, method.id, updateReferencedField, source]);

  const referenceComponent = useMemo(() => ({
    id: `${method.id}_${messageProperty}_reference`,
    self: { current: {} },
    getComponent: (params: Record<string, unknown>) => {
      if (!editor.connection) return null;
      const referenceMeta = params.ReferenceComponent as { self?: { current?: unknown } } | undefined;
      if (referenceMeta?.self) referenceMeta.self.current = true;
      return (
        <InlineBodyReferenceEditor
          referenceId={`${method.id}_${messageProperty}_reference`}
          connection={editor.connection}
          currentMethod={editor.method}
          submitEdit={params.submitEdit as () => void}
          onClose={params.editCancel as (() => void) | undefined}
        />
      );
    },
  }), [editor.connection, editor.method, messageProperty, method.id]);

  const leftItems: CollapseItem[] = [
    {
      key: 'referenceInfo',
      label: t('referenceInfo.legacyTitle'),
      content: hasReferenceInfo ? (
        <ReferenceInfo messageProperty={messageProperty} data={{}} onReferenceClick={editor.setSelectedEnhanceId} />
      ) : (
        <Empty description={t('referenceInfo.empty')} />
      ),
    },
    {
      key: 'requestData',
      label: t('requestData'),
      content: (
        <div
          className='bodyLegacyJsonWrap'
          onMouseDownCapture={(event) => {
            const target = event.target as HTMLElement | null;
            const trigger = target?.closest('.click-to-reference') as HTMLElement | null;
            if (!trigger) return;
            const row = (trigger.closest('.variable-row') as HTMLElement | null) || (trigger.closest('.object-key-val') as HTMLElement | null) || trigger;
            const container = (trigger.closest('.bodyLegacyLeft') as HTMLElement | null) || (trigger.closest('.bodyLegacyJsonWrap') as HTMLElement | null);
            const rect = row.getBoundingClientRect();
            const containerRect = container?.getBoundingClientRect();
            setLastBodyReferenceTriggerRect({ left: rect.left, top: rect.top, width: rect.width, height: rect.height, containerLeft: containerRect?.left, containerRight: containerRect?.right });
          }}
        >
          <PatchedReactJson
            name={false}
            collapsed={false}
            src={source}
            onSelect={editor.onSelect}
            onEdit={readOnly ? false : editor.syncSource}
            onDelete={readOnly ? false : editor.syncSource}
            onAdd={readOnly ? false : editor.syncSource}
            PointerComponent={pointerComponent}
            ReferenceComponent={referenceComponent}
            WebhookComponent={webhookComponent}
            onReferenceClick={(_event: unknown, data: Record<string, unknown>) => {
              const field = getJsonReferenceField(data);
              if (!field) return;
              editor.selectField(field.namespace, field.name, field.value);
            }}
            theme={themeMode === 'dark' ? 'twilight' : 'rjv-default'}
            style={{ wordBreak: 'break-word', padding: '8px 0', background: 'transparent', fontSize: 13 }}
          />
        </div>
      ),
    },
  ];

  return (
    <Splitter
      className='bodyLegacyLayout'
      panels={[
        {
          key: 'left',
          defaultSize: '52%',
          min: '32%',
          max: '74%',
          content: (
            <div className='bodyLegacyLeft'>
              {/* Disable collapse motion: the height animation expands the panel to
                  full content height before flex clamps it to ~50%, causing a visible
                  "open full then jump up" glitch. Instant toggle avoids it. */}
              <ConfigProvider theme={{ token: { motion: false } }}>
                <Collapse className='bodyLegacyLeftCollapse' items={leftItems} defaultActiveKeys={['requestData']} />
              </ConfigProvider>
            </div>
          ),
        },
        {
          key: 'enhancement',
          content: (
            <div className='bodyLegacyEnhancement'>
              <ReferenceEnhancement readOnly={readOnly} enhancement={editor.currentEnhancement} />
            </div>
          ),
        },
      ]}
    />
  );
}
