import { CloseOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Provider } from 'react-redux';
import { useSelector } from 'react-redux';
import LegacyUrlEditor from './url-editor/UrlEditor';
import { BodyEditor } from './body-editor/BodyEditor';
import { HeaderEditor } from './header-editor/HeaderEditor';
import { MethodProvider } from '../../providers/MethodContext';
import { clearConnection, setConnection, setFlowchart } from '../../store/connection/connectionSlice';
import type { RootState } from '../../store';
import { createLegacyStore } from '../../store';
import type { WorkflowMethodConfig } from '../../types/request-config.types';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import { buildLegacyConnection, extractWorkflowMethodConfig } from './legacyAdapter';
import { buildFromConnectorPayload } from '../../api/connectionPayload';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type Props = {
  open: boolean;
  node: WorkflowNodeModel | null;
  mode: 'url' | 'body' | 'header' | null;
  nodes: WorkflowNodeModel[];
  edges?: WorkflowEdgeModel[];
  fieldBindings?: any[];
  onFieldBindingsChange?: (fieldBindings: any[]) => void;
  onClose: () => void;
  onSave: (nodeId: string, config: WorkflowMethodConfig, fieldBindings?: any[]) => void;
};

function LegacyUrlEditorContent({ nodeId }: { nodeId: string }) {
  const method = useSelector((state: RootState) =>
    state.connection.connection?.fromConnector.method
      .find((item) => item.id === nodeId) ?? null,
  );

  if (!method) return null;

  return (
    <MethodProvider value={{ method }}>
      <LegacyUrlEditor />
    </MethodProvider>
  );
}

function LegacyBodyEditorContent({ nodeId }: { nodeId: string }) {
  const method = useSelector((state: RootState) =>
    state.connection.connection?.fromConnector.method
      .find((item) => item.id === nodeId) ?? null,
  );

  if (!method) return null;

  return (
    <MethodProvider value={{ method }}>
      <BodyEditor />
    </MethodProvider>
  );
}

function LegacyHeaderEditorContent({ nodeId }: { nodeId: string }) {
  const method = useSelector((state: RootState) =>
    state.connection.connection?.fromConnector.method
      .find((item) => item.id === nodeId) ?? null,
  );

  if (!method) return null;

  return (
    <MethodProvider value={{ method }}>
      <HeaderEditor />
    </MethodProvider>
  );
}

export function MethodConfigDialog({ open, node, mode, nodes, edges, fieldBindings, onFieldBindingsChange, onClose, onSave }: Props) {
  const { t } = useI18n('workflow');
  const store = useMemo(() => createLegacyStore(), []);
  const connection = useMemo(() => {
    const legacyConnection = buildLegacyConnection(nodes);
    const fromConnectorPayload = buildFromConnectorPayload(nodes, edges ?? []) as any;
    const indexById = new Map<string, string>(
      (fromConnectorPayload.methods ?? []).map((method: any) => [method.id, method.index]),
    );
    return {
      ...legacyConnection,
      ...(Array.isArray(fieldBindings) ? { fieldBindings } : {}),
      fromConnector: {
        ...legacyConnection.fromConnector,
        method: legacyConnection.fromConnector.method.map((method) => ({
          ...method,
          index: indexById.get(method.id) ?? method.index,
        })),
        operator: fromConnectorPayload.operators ?? [],
      },
      ui: {
        ...legacyConnection.ui,
        workflowEdges: edges ?? [],
      } as any,
    };
  }, [edges, fieldBindings, nodes]);
  const isPersistingRef = useRef(false);
  const activeSessionRef = useRef<string | null>(null);
  const sessionKey = open && node ? `${node.id}:${mode ?? ''}` : null;

  useEffect(() => {
    if (!open || !sessionKey) return;
    if (activeSessionRef.current === sessionKey) return;
    activeSessionRef.current = sessionKey;
    store.dispatch(setConnection(connection));
    store.dispatch(setFlowchart('workflow-flow'));
  }, [connection, open, sessionKey, store]);

  useEffect(() => {
    if (open) return;
    if (activeSessionRef.current) {
      activeSessionRef.current = null;
      store.dispatch(clearConnection());
    }
  }, [open, store]);

  useEffect(() => () => {
    store.dispatch(clearConnection());
  }, [store]);

  useEffect(() => {
    if (!open) return;

    const syncBindings = () => {
      const nextFieldBindings = store.getState().connection.connection?.fieldBindings;
      if (Array.isArray(nextFieldBindings)) {
        onFieldBindingsChange?.(nextFieldBindings);
      }
    };

    syncBindings();
    const unsubscribe = store.subscribe(syncBindings);
    return unsubscribe;
  }, [onFieldBindingsChange, open, store]);

  const persistCurrentConfig = useCallback(() => {
    if (!node || isPersistingRef.current) return;

    isPersistingRef.current = true;

    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) activeElement.blur();

    requestAnimationFrame(() => {
      const currentConnection = store.getState().connection.connection;
      const config = extractWorkflowMethodConfig(currentConnection, node.id);
      if (config) {
        onSave(node.id, config, currentConnection?.fieldBindings);
      } else {
        onClose();
      }
      isPersistingRef.current = false;
    });
  }, [node, onClose, onSave, store]);

  if (!open || !node) return null;
  const title = mode === 'body' ? t('methodConfig.body') : mode === 'header' ? t('methodConfig.header') : t('methodConfig.requestUrl');
  const width = mode === 'url' ? 1180 : '94vw';

  return (
    <Modal
      open={open}
      onCancel={persistCurrentConfig}
      width={width}
      style={mode !== 'url' ? { top: 18 } : undefined}
      destroyOnHidden
      title={title}
      closeIcon={<CloseOutlined />}
      styles={{
        body: {
          paddingTop: 8,
          ...(mode !== 'url' ? { height: 'calc(100vh - 191px)', overflow: 'hidden' } : null),
        },
      }}
      footer={[
        <Button key="close" type="primary" onClick={persistCurrentConfig}>
          {t('actions.close')}
        </Button>,
      ]}
    >
      <div style={{ height: mode !== 'url' ? 'calc(100vh - 199px)' : undefined }}>
        <Provider store={store}>
          {mode === 'body' ? (
            <LegacyBodyEditorContent nodeId={node.id} />
          ) : mode === 'header' ? (
            <LegacyHeaderEditorContent nodeId={node.id} />
          ) : (
            <LegacyUrlEditorContent nodeId={node.id} />
          )}
        </Provider>
      </div>
    </Modal>
  );
}
