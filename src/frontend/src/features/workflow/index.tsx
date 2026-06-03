import { Background } from '@xyflow/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Modal, Select, message } from 'antd';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { apiExecutor } from '@shared/api/apiExecutor';
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
import { loadConnectionVersions, loadWorkflowConnection, loadWorkflowConnectionVersion, removeConnectionVersion, saveConnectionVersionComment, saveWorkflowConnection } from './api/connectionService';
import { mapConnectionToWorkflowState } from './api/connectionMapper';
import { buildConnectionPayload, buildFromConnectorPayload } from './api/connectionPayload';
import { useGetConnectorsQuery } from '@entities/connector/api/connectorApi';
import { selectAuthUser } from '@entities/auth/model/authSelectors';
import { store } from '@app/store/store';
import { genericApi } from '@shared/api/genericApi';
import { useAppSelector } from '@shared/lib/storeHooks';
import type { Connector } from '@entities/connector/model/types';
import type { AuthUser } from '@entities/auth/model/types';
import type { HistoryVersionItem } from './types/history.types';
import type { WorkflowEdgeModel, WorkflowHeaderMenuItem, WorkflowNodeModel } from './types/workflow.types';
import { createEmptyMethodConfig } from './utils/requestConfig';

const toWorkflowResponse = (nodeId: string, response: NonNullable<Connector['invoker']>['operations'][number]['response']) => ({
  responseId: `response-${nodeId}`,
  success: response.success,
  fail: response.fail,
});

const normalizeConnectorIcon = (icon: Connector['icon']) =>
  typeof icon === 'string' ? icon : null;

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
    if (!connector && !operation?.response) return node;

    return {
      ...node,
      data: {
        ...node.data,
        connector: connector
          ? {
              ...node.data.connector,
              connectorId: connector.connectorId,
              title: connector.title,
              icon: normalizeConnectorIcon(connector.icon),
            }
          : node.data.connector,
        methodConfig: operation?.response
          ? {
              ...createEmptyMethodConfig(),
              ...node.data.methodConfig,
              response: toWorkflowResponse(node.id, operation.response),
            }
          : node.data.methodConfig,
      },
    };
  });
};

type WorkflowProps = {
  readOnly?: boolean;
};

type WorkflowChangeSource = 'clean' | 'manual' | 'history';

type Template = {
  templateId: string | number;
  name?: string;
  description?: string;
  connection?: unknown;
  [key: string]: unknown;
};

const CONNECTION_TEMPLATE_VERSION = '5.0';
const EMPTY_DESCRIPTION_LABEL = '[Empty Description]';

const toDisplayDescription = (description?: string) =>
  description && description.trim() ? description : EMPTY_DESCRIPTION_LABEL;

const FIELD_BINDING_COLOR_RE = /#[A-Fa-f0-9]{6}/g;

const getFieldBindingColors = (binding: any) =>
  Object.values(binding?.enhancement?.args || {})
    .flatMap((value) => typeof value === 'string' ? value.match(FIELD_BINDING_COLOR_RE) || [] : [])
    .map((color) => color.toLowerCase());

const removeFieldBindingsByMethodColors = (fieldBindings: any[] | undefined, methodColors: Set<string>) => {
  if (!Array.isArray(fieldBindings) || methodColors.size === 0) return fieldBindings;
  return fieldBindings.filter((binding) =>
    getFieldBindingColors(binding).every((color) => !methodColors.has(color)),
  );
};

const getProfileAuthorName = (user: AuthUser | null) => {
  const fullName = [user?.userDetail?.name, user?.userDetail?.surname]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
  return fullName || user?.username || user?.email || undefined;
};

const applyProfileAuthor = (versions: HistoryVersionItem[], user: AuthUser | null) => {
  const profileAuthor = getProfileAuthorName(user);
  if (!profileAuthor) return versions;

  return versions.map((version) =>
    String(version.author) === String(user?.userId)
      ? { ...version, author: profileAuthor }
      : version,
  );
};

const sortValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortValue);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, sortValue(nested)]),
  );
};

const buildWorkflowChangeSnapshot = ({
  connectionId,
  title,
  description,
  nodes,
  edges,
  fieldBindings,
}: {
  connectionId?: string;
  title: string;
  description: string;
  nodes: WorkflowNodeModel[];
  edges: WorkflowEdgeModel[];
  fieldBindings?: any[];
}) =>
  JSON.stringify(sortValue(buildConnectionPayload({
    connectionId,
    title,
    description,
    nodes,
    edges,
    fieldBindings,
  })));

const triggerJsonDownload = (filename: string, payload: unknown) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export default function Workflow({ readOnly = false }: WorkflowProps = {}) {
  const { connectionId } = useParams<{ connectionId: string }>();
  const navigate = useNavigate();
  const { t: tEntities } = useI18n('entities');
  const authUser = useAppSelector(selectAuthUser);
  const { data: connectors = [], isLoading: isConnectorsLoading } = useGetConnectorsQuery({ page: 0, limit: 1000 });
  const [headerState, setHeaderState] = useState({
    title: '[Empty Name]',
    description: '[Empty Description]',
  });
  const [loadedFieldBindings, setLoadedFieldBindings] = useState<any[] | undefined>();
  const cleanDeletedNodeFieldBindings = useCallback((deletedNodeIds: string[], previousNodes: WorkflowNodeModel[]) => {
    const deletedIds = new Set(deletedNodeIds);
    const deletedMethodColors = new Set(
      buildLegacyConnection(previousNodes).fromConnector.method
        .filter((method) => deletedIds.has(method.id))
        .map((method) => method.color.toLowerCase()),
    );
    previousNodes
      .filter((node) => deletedIds.has(node.id) && typeof (node.data as any).color === 'string')
      .forEach((node) => deletedMethodColors.add(String((node.data as any).color).toLowerCase()));
    setLoadedFieldBindings((current) => removeFieldBindingsByMethodColors(current, deletedMethodColors));
  }, []);
  const workflow = useWorkflowPage({ onDeleteNodes: cleanDeletedNodeFieldBindings });
  const [historyVersions, setHistoryVersions] = useState<HistoryVersionItem[]>([]);
  const [selectedHistoryVersionId, setSelectedHistoryVersionId] = useState<string | null>(null);
  const [baselineSnapshot, setBaselineSnapshot] = useState<string | null>(null);
  const [changeSource, setChangeSource] = useState<WorkflowChangeSource>('clean');
  const [historyPreviewSnapshot, setHistoryPreviewSnapshot] = useState<string | null>(null);
  const [isConnectionLoading, setIsConnectionLoading] = useState<boolean>(Boolean(connectionId));
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateNameError, setTemplateNameError] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [loadTemplateDialogOpen, setLoadTemplateDialogOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>();
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const hydratedNodes = useMemo(
    () => hydrateNodesWithOperationResponses(workflow.nodes, connectors),
    [connectors, workflow.nodes],
  );
  const displayedHistoryVersions = useMemo(
    () => applyProfileAuthor(historyVersions, authUser),
    [authUser, historyVersions],
  );
  const currentChangeSnapshot = useMemo(
    () => buildWorkflowChangeSnapshot({
      connectionId,
      title: headerState.title,
      description: headerState.description,
      nodes: hydratedNodes,
      edges: workflow.edges,
      fieldBindings: loadedFieldBindings,
    }),
    [connectionId, headerState.description, headerState.title, hydratedNodes, loadedFieldBindings, workflow.edges],
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
    setBaselineSnapshot(null);
    setChangeSource('clean');
    setHistoryPreviewSnapshot(null);
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
        setHeaderState({ title: state.title, description: toDisplayDescription(state.description) });
        setLoadedFieldBindings(state.fieldBindings);
        setHistoryVersions(state.versions);
        setSelectedHistoryVersionId((currentSelectedId) =>
          currentSelectedId && state.versions.some((version) => version.id === currentSelectedId)
            ? currentSelectedId
            : state.versions.find((version) => version.current)?.id ?? state.versions[0]?.id ?? null,
        );
      })
      .finally(() => {
        if (!cancelled) setIsConnectionLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [connectionId]);

  const isLoading = isConnectionLoading || isConnectorsLoading;
  const hasConnectionChanges = baselineSnapshot !== null && currentChangeSnapshot !== baselineSnapshot;
  const hasManualUnsavedChanges = hasConnectionChanges && changeSource === 'manual';

  useEffect(() => {
    if (isLoading || baselineSnapshot !== null) return;
    setBaselineSnapshot(currentChangeSnapshot);
    setChangeSource('clean');
    setHistoryPreviewSnapshot(null);
  }, [baselineSnapshot, currentChangeSnapshot, isLoading]);

  useEffect(() => {
    if (isLoading || baselineSnapshot === null) return;
    if (currentChangeSnapshot === baselineSnapshot) {
      setChangeSource('clean');
      setHistoryPreviewSnapshot(null);
      return;
    }
    if (changeSource === 'history' && currentChangeSnapshot === historyPreviewSnapshot) return;
    setChangeSource('manual');
  }, [baselineSnapshot, changeSource, currentChangeSnapshot, historyPreviewSnapshot, isLoading]);

  const handleSave = async ({ title, description, comment }: { title: string; description: string; comment: string }) => {
    if (title.trim() === '[Empty Name]') {
      message.error('Please enter connection name');
      throw new Error('Connection name is required');
    }

    const normalizedDescription = description.trim() === EMPTY_DESCRIPTION_LABEL ? '' : description;
    const isCreate = !connectionId;
    let response;
    try {
      response = await saveWorkflowConnection({
        connectionId,
        title,
        description: normalizedDescription,
        comment,
        nodes: hydratedNodes,
        edges: workflow.edges,
        viewport: workflow.getViewport(),
        fieldBindings: loadedFieldBindings,
      });
    } catch (error) {
      message.error(
        tEntities(isCreate ? 'connection.messages.saveFailed.create' : 'connection.messages.saveFailed.update', { title }),
      );
      throw error;
    }
    const savedId = (response.data as any)?.connectionId;
    const nextConnectionId = connectionId ?? savedId;
    setHeaderState({ title, description: toDisplayDescription(normalizedDescription) });
    setBaselineSnapshot(buildWorkflowChangeSnapshot({
      connectionId: nextConnectionId ? String(nextConnectionId) : connectionId,
      title,
      description: normalizedDescription,
      nodes: hydratedNodes,
      edges: workflow.edges,
      fieldBindings: loadedFieldBindings,
    }));
    setChangeSource('clean');
    setHistoryPreviewSnapshot(null);
    if (nextConnectionId) {
      const nextVersions = await loadConnectionVersions(nextConnectionId);
      setHistoryVersions(nextVersions);
      setSelectedHistoryVersionId(nextVersions[0]?.id ?? null);
    }
    store.dispatch(genericApi.util.invalidateTags([{ type: 'Entity', id: '/connection/all/meta' }] as any));
    message.success(
      tEntities(isCreate ? 'connection.messages.saved.create' : 'connection.messages.saved.update', { title }),
    );
    if (isCreate && savedId) navigate(`/connection/update/${savedId}`);
  };

  const downloadConnectionTemplate = async () => {
    if (!connectionId) return;
    try {
      const template = (await apiExecutor({
        url: `/template/connection/${connectionId}`,
        method: 'GET',
      })) as Template;
      const filename = String(template?.templateId ?? connectionId);
      triggerJsonDownload(filename, template);
      message.success(tEntities('connection.list.downloadTemplate.success', { name: filename }));
    } catch (err) {
      console.error(err);
      message.error(tEntities('connection.list.downloadTemplate.error'));
    }
  };

  const openSaveTemplateDialog = () => {
    setTemplateName('');
    setTemplateDescription('');
    setTemplateNameError('');
    setTemplateDialogOpen(true);
  };

  const closeSaveTemplateDialog = () => {
    if (isSavingTemplate) return;
    setTemplateDialogOpen(false);
    setTemplateNameError('');
  };

  const saveConnectionAsTemplate = async () => {
    const name = templateName.trim();
    if (!name) {
      setTemplateNameError('Name is required');
      return;
    }

    setIsSavingTemplate(true);
    try {
      const connection = buildConnectionPayload({
        title: headerState.title,
        description: headerState.description,
        nodes: hydratedNodes,
        edges: workflow.edges,
        viewport: workflow.getViewport(),
        fieldBindings: loadedFieldBindings,
      });

      const response = await apiExecutor({
        url: '/template',
        method: 'POST',
        body: {
          version: CONNECTION_TEMPLATE_VERSION,
          name,
          description: templateDescription,
          connection,
        },
      });
      if ((response as any)?.status || (response as any)?.error) throw response;

      store.dispatch(genericApi.util.invalidateTags([{ type: 'Entity', id: '/template/all' }] as any));
      setTemplateDialogOpen(false);
      message.success(`Template "${name}" saved`);
    } catch (err) {
      console.error(err);
      message.error('Failed to save template');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const openLoadTemplateDialog = async () => {
    setLoadTemplateDialogOpen(true);
    setSelectedTemplateId(undefined);
    setIsLoadingTemplates(true);
    try {
      const response = await apiExecutor({
        url: '/template/all',
        method: 'GET',
      });
      const nextTemplates = Array.isArray(response) ? response : [];
      setTemplates(nextTemplates);
    } catch (err) {
      console.error(err);
      message.error('Failed to load templates');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const closeLoadTemplateDialog = () => {
    if (isApplyingTemplate) return;
    setLoadTemplateDialogOpen(false);
    setSelectedTemplateId(undefined);
  };

  const applySelectedTemplate = async () => {
    const selectedTemplate = templates.find((template) => String(template.templateId) === selectedTemplateId);
    if (!selectedTemplate?.connection) {
      message.error('Please select a template');
      return;
    }

    setIsApplyingTemplate(true);
    try {
      const state = mapConnectionToWorkflowState(selectedTemplate.connection);
      workflow.setWorkflowGraph(state.nodes, state.edges, state.viewport, { centerStart: true });
      setLoadedFieldBindings(state.fieldBindings);
      setLoadTemplateDialogOpen(false);
      setSelectedTemplateId(undefined);
      message.success(`Template "${selectedTemplate.name ?? selectedTemplate.templateId}" loaded`);
    } catch (err) {
      console.error(err);
      message.error('Failed to load template');
    } finally {
      setIsApplyingTemplate(false);
    }
  };

  const handleHeaderMenuSelect = (item: WorkflowHeaderMenuItem) => {
    if (item.id === 'download-template') {
      void downloadConnectionTemplate();
    } else if (item.id === 'save-template') {
      openSaveTemplateDialog();
    } else if (item.id === 'load-template') {
      void openLoadTemplateDialog();
    }
  };

  const handleOpenHistory = () => {
    workflow.setHistoryOpen(true);
    workflow.setSidebarAction(null);
    workflow.setContextMenu(null);
    workflow.setConditionEditor(null);
    if (connectionId) {
      void loadConnectionVersions(connectionId).then((nextVersions) => {
        setHistoryVersions(nextVersions);
        setSelectedHistoryVersionId((currentSelectedId) =>
          currentSelectedId && nextVersions.some((version) => version.id === currentSelectedId)
            ? currentSelectedId
            : nextVersions.find((version) => version.current)?.id ?? nextVersions[0]?.id ?? null,
        );
      });
    }
  };

  return (
    <div className="page">
      <WorkflowHeader
        initialName={headerState.title}
        initialDescription={headerState.description}
        onChange={setHeaderState}
        onMenuItemSelect={handleHeaderMenuSelect}
        onSave={handleSave}
        saveDisabled={isLoading || !hasConnectionChanges}
        onOpenHistory={handleOpenHistory}
        readOnly={readOnly}
      />
      <Modal
        open={templateDialogOpen}
        title="Add Template"
        onCancel={closeSaveTemplateDialog}
        destroyOnHidden
        width={520}
        footer={[
          <Button key="cancel" onClick={closeSaveTemplateDialog} disabled={isSavingTemplate}>
            Cancel
          </Button>,
          <Button key="ok" type="primary" loading={isSavingTemplate} onClick={saveConnectionAsTemplate}>
            Ok
          </Button>,
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span>
              Name
              <span style={{ color: '#d4380d' }}> *</span>
            </span>
            <Input
              autoFocus
              maxLength={255}
              value={templateName}
              status={templateNameError ? 'error' : undefined}
              onChange={(event) => {
                setTemplateName(event.target.value);
                if (templateNameError) setTemplateNameError('');
              }}
              onPressEnter={saveConnectionAsTemplate}
              showCount
            />
            {templateNameError ? <span style={{ color: '#d4380d', fontSize: 12 }}>{templateNameError}</span> : null}
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span>Description</span>
            <div style={{ position: 'relative' }}>
              <Input.TextArea
                maxLength={5000}
                rows={4}
                value={templateDescription}
                onChange={(event) => setTemplateDescription(event.target.value)}
                style={{ paddingBottom: 26 }}
              />
              <span style={{ position: 'absolute', right: 12, bottom: 6, color: '#8c8c8c', pointerEvents: 'none' }}>
                {templateDescription.length} / 5000
              </span>
            </div>
          </label>
        </div>
      </Modal>
      <Modal
        open={loadTemplateDialogOpen}
        title="Load Template"
        onCancel={closeLoadTemplateDialog}
        destroyOnHidden
        width={520}
        footer={[
          <Button key="cancel" onClick={closeLoadTemplateDialog} disabled={isApplyingTemplate}>
            Cancel
          </Button>,
          <Button key="load" type="primary" loading={isApplyingTemplate} onClick={applySelectedTemplate}>
            Load
          </Button>,
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ color: '#8c8c8c' }}>
            If you load a template, all your current workflow changes will be replaced.
          </div>
          <Select
            loading={isLoadingTemplates}
            value={selectedTemplateId}
            placeholder="Select template"
            onChange={setSelectedTemplateId}
            options={templates.map((template) => ({
              value: String(template.templateId),
              label: template.description
                ? `${template.name ?? template.templateId} - ${template.description}`
                : String(template.name ?? template.templateId),
            }))}
            showSearch={{
              filterOption: (input, option) =>
                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
            }}
            style={{ width: '100%' }}
          />
        </div>
      </Modal>
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
      <HistoryPanel
        open={workflow.historyOpen}
        items={displayedHistoryVersions}
        selectedId={selectedHistoryVersionId}
        onSelectedIdChange={setSelectedHistoryVersionId}
        hasUnsavedChanges={hasManualUnsavedChanges}
        onClose={() => workflow.setHistoryOpen(false)}
        onSelectVersion={async (snapshotId) => {
          if (!connectionId) return;
          setSelectedHistoryVersionId(snapshotId);
          const state = await loadWorkflowConnectionVersion(connectionId, snapshotId);
          const nextNodes = hydrateNodesWithOperationResponses(state.nodes, connectors);
          const nextSnapshot = buildWorkflowChangeSnapshot({
            connectionId,
            title: state.title,
            description: state.description,
            nodes: nextNodes,
            edges: state.edges,
          });
          workflow.setWorkflowGraph(state.nodes, state.edges, state.viewport, { centerStart: true });
          setHeaderState({ title: state.title, description: toDisplayDescription(state.description) });
          setLoadedFieldBindings(state.fieldBindings);
          setHistoryPreviewSnapshot(nextSnapshot);
          setChangeSource(nextSnapshot === baselineSnapshot ? 'clean' : 'history');
          workflow.setSidebarAction(null);
          workflow.setContextMenu(null);
          workflow.setMethodEditor(null);
          workflow.setConditionEditor(null);
        }}
        onSaveComment={async (snapshotId, comment) => {
          if (!connectionId) return;
          await saveConnectionVersionComment(connectionId, snapshotId, comment);
          setHistoryVersions(await loadConnectionVersions(connectionId));
        }}
        onDeleteVersion={async (snapshotId) => {
          if (!connectionId) return;
          await removeConnectionVersion(connectionId, snapshotId);
          const nextVersions = await loadConnectionVersions(connectionId);
          setHistoryVersions(nextVersions);
          setSelectedHistoryVersionId((currentSelectedId) =>
            currentSelectedId && nextVersions.some((version) => version.id === currentSelectedId)
              ? currentSelectedId
              : nextVersions.find((version) => version.current)?.id ?? nextVersions[0]?.id ?? null,
          );
        }}
        onDownloadTemplate={downloadConnectionTemplate}
      />
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
        onFieldBindingsChange={setLoadedFieldBindings}
        onClose={() => workflow.setMethodEditor(null)}
        onSave={(nodeId, config, nextFieldBindings) => {
          if (Array.isArray(nextFieldBindings)) {
            setLoadedFieldBindings(nextFieldBindings);
          }
          workflow.onSaveMethodConfig(nodeId, config);
        }}
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
