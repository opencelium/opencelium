import { Background } from '@xyflow/react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { message } from 'antd';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import './styles.css';
import { NodeContextMenu } from './components/NodeContextMenu';
import { WorkflowCanvas } from './components/WorkflowCanvas';
import { WorkflowHeader } from './components/WorkflowHeader';
import { WorkflowLogs } from './components/WorkflowLogs';
import { WorkflowSidebar } from './components/WorkflowSidebar';
import { HistoryPanel } from './components/header/HistoryPanel';
import { ConditionBuilderDialog } from './components/condition-builder/ConditionBuilder';
import { MethodConfigDialog } from './components/request-editor/MethodConfigDialog';
import { buildLegacyConnection } from './components/request-editor/legacyAdapter';
import { useWorkflowPage } from './useWorkflowPage';
import { loadWorkflowConnection, saveWorkflowConnection } from './api/connectionService';
import { buildFromConnectorPayload } from './api/connectionPayload';
import { useGetConnectorsQuery } from '@entities/connector/api/connectorApi';
import type { Connector } from '@entities/connector/model/types';
import type { WorkflowNodeModel } from './types/workflow.types';
import { createEmptyMethodConfig } from './utils/requestConfig';

const toWorkflowResponse = (nodeId: string, response: NonNullable<Connector['invoker']>['operations'][number]['response']) => ({
  responseId: `response-${nodeId}`,
  success: response.success,
  fail: response.fail,
});

const hydrateNodesWithOperationResponses = (
  nodes: WorkflowNodeModel[],
  connectors: Connector[],
): WorkflowNodeModel[] => {
  if (!connectors.length) return nodes;

  return nodes.map((node) => {
    if (node.type !== 'connector' && node.type !== 'system') return node;
    const connectorId = node.data.connector?.connectorId;
    const methodName = node.data.subtitle;
    if (!connectorId || !methodName) return node;

    const connector = connectors.find((item) => item.connectorId === connectorId);
    const operation = connector?.invoker?.operations?.find((item) => item.name.toLowerCase() === methodName.toLowerCase());
    if (!operation?.response) return node;

    return {
      ...node,
      data: {
        ...node.data,
        methodConfig: {
          ...createEmptyMethodConfig(),
          ...node.data.methodConfig,
          response: toWorkflowResponse(node.id, operation.response),
        },
      },
    };
  });
};

type WorkflowProps = {
  readOnly?: boolean;
};

export default function Workflow({ readOnly = false }: WorkflowProps = {}) {
  const { connectionId } = useParams<{ connectionId: string }>();
  const navigate = useNavigate();
  const { t: tEntities } = useI18n('entities');
  const workflow = useWorkflowPage();
  const { data: connectors = [], isLoading: isConnectorsLoading } = useGetConnectorsQuery({ page: 0, limit: 1000 });
  const [headerState, setHeaderState] = useState({
    title: '[Empty Name]',
    description: '[Empty Description]',
  });
  const [loadedFieldBindings, setLoadedFieldBindings] = useState<any[] | undefined>();
  const [isConnectionLoading, setIsConnectionLoading] = useState<boolean>(Boolean(connectionId));
  const hydratedNodes = useMemo(
    () => hydrateNodesWithOperationResponses(workflow.nodes, connectors),
    [connectors, workflow.nodes],
  );
  const selectedNode = hydratedNodes.find((node) => node.id === workflow.sidebarAction?.sourceNodeId) ?? null;
  const contextMenuNode = hydratedNodes.find((node) => node.id === workflow.contextMenu?.nodeId) ?? null;
  const editorNode = hydratedNodes.find((node) => node.id === workflow.methodEditor?.nodeId) ?? null;
  const conditionNode = hydratedNodes.find((node) => node.id === workflow.conditionEditor?.nodeId) ?? null;
  const conditionConnection = useMemo(() => {
    const legacyConnection = buildLegacyConnection(hydratedNodes);
    const fromConnector = buildFromConnectorPayload(hydratedNodes, workflow.edges) as any;
    return {
      ...legacyConnection,
      fieldBindings: loadedFieldBindings ?? legacyConnection.fieldBindings,
      fromConnector: {
        connectorId: fromConnector.connectorId,
        title: fromConnector.title,
        method: fromConnector.methods ?? fromConnector.method ?? [],
        operator: fromConnector.operators ?? fromConnector.operator ?? [],
      },
    };
  }, [hydratedNodes, loadedFieldBindings, workflow.edges]);

  useEffect(() => {
    if (!connectionId) {
      setIsConnectionLoading(false);
      return;
    }
    let cancelled = false;
    setIsConnectionLoading(true);
    loadWorkflowConnection(connectionId)
      .then((state) => {
        if (cancelled) return;
        workflow.setWorkflowGraph(state.nodes, state.edges, state.viewport, { centerStart: true });
        setHeaderState({ title: state.title, description: state.description });
        setLoadedFieldBindings(state.fieldBindings);
      })
      .finally(() => {
        if (!cancelled) setIsConnectionLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [connectionId]);

  const isLoading = isConnectionLoading || isConnectorsLoading;

  const handleSave = async ({ title, description, comment }: { title: string; description: string; comment: string }) => {
    const isCreate = !connectionId;
    let response;
    try {
      response = await saveWorkflowConnection({
        connectionId,
        title,
        description,
        comment,
        nodes: hydratedNodes,
        edges: workflow.edges,
        viewport: workflow.getViewport(),
      });
    } catch (error) {
      message.error(
        tEntities(isCreate ? 'connection.messages.saveFailed.create' : 'connection.messages.saveFailed.update', { title }),
      );
      throw error;
    }
    const savedId = (response.data as any)?.connectionId;
    message.success(
      tEntities(isCreate ? 'connection.messages.saved.create' : 'connection.messages.saved.update', { title }),
    );
    if (isCreate && savedId) navigate(`/connection/update/${savedId}`);
  };

  return (
    <div className="page">
      <WorkflowHeader
        initialName={headerState.title}
        initialDescription={headerState.description}
        onSave={handleSave}
        onOpenHistory={() => { workflow.setHistoryOpen(true); workflow.setSidebarAction(null); workflow.setContextMenu(null); workflow.setConditionEditor(null); }}
        readOnly={readOnly}
      />
      <div className="workflowMain">
        {isLoading ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loading size="lg" />
          </div>
        ) : (
          <>
            <WorkflowCanvas
              nodes={workflow.nodes}
              edges={workflow.edges}
              restoredViewport={workflow.restoredViewport}
              viewportRestoreVersion={workflow.viewportRestoreVersion}
              centerStartVersion={workflow.centerStartVersion}
              onInit={workflow.setReactFlowInstance}
              activeAction={workflow.sidebarAction}
              onNodesChange={workflow.onNodesChange}
              onEdgesChange={workflow.onEdgesChange}
              onConnect={workflow.onConnect}
              onOpenAddStep={workflow.onOpenAddStep}
              onOpenContextMenu={workflow.setContextMenu}
              onNodeDoubleClick={(_, node) => {
                workflow.setSidebarAction(null);
                workflow.setContextMenu(null);
                workflow.setHistoryOpen(false);

                if (node.type === 'connector' || node.type === 'system') {
                  workflow.setConditionEditor(null);
                  workflow.setMethodEditor({ nodeId: node.id, mode: 'body' });
                  return;
                }

                if (node.type === 'if' || node.type === 'loop') {
                  workflow.setMethodEditor(null);
                  workflow.setConditionEditor({ nodeId: node.id });
                }
              }}
              onDeleteNode={workflow.onDeleteNode}
              onPaneClick={() => { workflow.setSidebarAction(null); workflow.setContextMenu(null); workflow.setHistoryOpen(false); workflow.setConditionEditor(null); }}
            >
              <Background gap={16} size={1} />
            </WorkflowCanvas>
            <WorkflowLogs />
          </>
        )}
      </div>
      <WorkflowSidebar action={workflow.sidebarAction} selectedNode={selectedNode} onClose={() => workflow.setSidebarAction(null)} onSelect={workflow.onAddStep} />
      <HistoryPanel open={workflow.historyOpen} onClose={() => workflow.setHistoryOpen(false)} />
      <NodeContextMenu
        menu={workflow.contextMenu}
        node={contextMenuNode}
        onChangeLabel={workflow.onChangeNodeLabel}
        onOpenRequestEditor={(nodeId, mode) => workflow.setMethodEditor({ nodeId, mode })}
        onOpenConditionEditor={(nodeId) => workflow.setConditionEditor({ nodeId })}
        onClose={() => workflow.setContextMenu(null)}
      />
      <MethodConfigDialog
        open={!!workflow.methodEditor}
        node={editorNode}
        mode={workflow.methodEditor?.mode ?? null}
        nodes={hydratedNodes}
        edges={workflow.edges}
        fieldBindings={loadedFieldBindings}
        onClose={() => workflow.setMethodEditor(null)}
        onSave={workflow.onSaveMethodConfig}
      />
      <ConditionBuilderDialog
        open={!!workflow.conditionEditor}
        node={conditionNode}
        nodes={hydratedNodes}
        connection={conditionConnection}
        onClose={() => workflow.setConditionEditor(null)}
        onSave={workflow.onSaveConditionConfig}
      />
    </div>
  );
}
