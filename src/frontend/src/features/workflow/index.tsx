import { Background } from '@xyflow/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Modal, Select, message } from 'antd';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { apiExecutor } from '@shared/api/apiExecutor';
import './styles.css';
import { NodeContextMenu } from './components/NodeContextMenu/NodeContextMenu';
import { WorkflowCanvas } from './components/WorkflowCanvas/WorkflowCanvas';
import { WorkflowHeader } from './components/WorkflowHeader';
import { WorkflowLogs } from './components/WorkflowLogs';
import { WorkflowSidebar } from './components/WorkflowSidebar/WorkflowSidebar';
import { WorkflowSchedulesPill } from './components/schedules/WorkflowSchedulesPill';
import { WorkflowSchedulesPanel } from './components/schedules/WorkflowSchedulesPanel';
import { HistoryPanel } from './components/header/HistoryPanel';
import { ShortcutsDialog } from './components/header/ShortcutsDialog';
import { ConditionBuilderDialog } from './components/condition-builder/ConditionBuilder';
import { MethodConfigDialog } from './components/request-editor/MethodConfigDialog';
import { ResponseDialog } from './components/request-editor/ResponseDialog';
import { AggregatorConfigDialog } from './components/aggregator/AggregatorConfigDialog';
import { TemplateConnectorMappingDialog } from './components/template/TemplateConnectorMappingDialog';
import { extractConnectorGroups, applyConnectorMapping, type ConnectorMappingGroup } from './components/template/templateConnectorMapping.utils';
import { buildLegacyConnection } from './components/request-editor/legacyAdapter';
import { useWorkflowPage } from './useWorkflowPage';
import { useUnsavedChangesGuard } from './useUnsavedChangesGuard';
import { TestRunProvider } from './test-run/TestRunProvider';
import { loadConnectionVersions, loadWorkflowConnection, loadWorkflowConnectionVersion, removeConnectionVersion, saveConnectionVersionComment, saveWorkflowConnection } from './api/connectionService';
import { mapConnectionToWorkflowState, type WorkflowConnectionState } from './api/connectionMapper';
import { buildConnectionPayload, buildFromConnectorPayload } from './api/connectionPayload';
import { RESOLVED_WORKFLOW_ERROR_MESSAGE_DURATION_SEC, resolveWorkflowApiError } from './utils/workflowApiErrors';
import { useGetConnectorsQuery } from '@entities/connector/api/connectorApi';
import { useGetInvokersQuery } from '@entities/invoker/api/invokerApi';
import type { Invoker } from '@entities/invoker/model/types';
import { selectAuthUser } from '@entities/auth/model/authSelectors';
import { store } from '@app/store/store';
import { genericApi } from '@shared/api/genericApi';
import { useAppSelector } from '@shared/lib/storeHooks';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import {
  pickConnectionTemplateFile,
  uploadConnectionTemplate,
} from '@entities/connectionTemplate/lib/uploadConnectionTemplate';
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
  invokers: Invoker[] = [],
): WorkflowNodeModel[] => {
  if (!connectors.length && !invokers.length) return nodes;

  return nodes.map((node) => {
    if (node.type !== 'connector' && node.type !== 'system') return node;
    const connectorId = node.data.connector?.connectorId;
    const methodName = node.data.subtitle;
    if (!connectorId || !methodName) return node;

    const connector = connectors.find((item) => item.connectorId === connectorId);
    const operation = connector?.invoker?.operations?.find((item) => item.name.toLowerCase() === methodName.toLowerCase());
    const invokerName = node.data.connector?.invokerName;
    const invokerIcon = !node.data.connector?.icon && invokerName
      ? invokers.find((item) => (item.name ?? '').toLowerCase() === invokerName.toLowerCase())?.icon ?? null
      : null;
    if (!connector && !operation?.response && !invokerIcon) return node;

    return {
      ...node,
      data: {
        ...node.data,
        connector: connector
          ? {
              ...node.data.connector,
              connectorId: connector.connectorId,
              title: connector.title,
              icon: normalizeConnectorIcon(connector.icon) ?? normalizeConnectorIcon(connector.invoker?.icon) ?? invokerIcon ?? node.data.connector?.icon ?? null,
              lastTestPassed: connector.lastTestPassed,
              lastTestError: connector.lastTestError,
            }
          : invokerIcon && node.data.connector
            ? { ...node.data.connector, icon: invokerIcon }
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
const EMPTY_NAME_LABEL = '[Empty Name]';
const EMPTY_DESCRIPTION_LABEL = '[Empty Description]';

const isHeaderNameEmpty = (title: string) => !title.trim() || title.trim() === EMPTY_NAME_LABEL;

const toDisplayDescription = (description?: string) =>
  description && description.trim() ? description : EMPTY_DESCRIPTION_LABEL;

const toPayloadDescription = (description?: string) =>
  description?.trim() === EMPTY_DESCRIPTION_LABEL ? '' : description ?? '';

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
  const { t } = useI18n('workflow');
  const confirm = useConfirm();
  const authUser = useAppSelector(selectAuthUser);
  const { data: connectors = [], isLoading: isConnectorsLoading } = useGetConnectorsQuery({ page: 0, limit: 1000 });
  const { data: invokers = [] } = useGetInvokersQuery();
  const [createdConnectionId, setCreatedConnectionId] = useState<string>();
  const [headerState, setHeaderState] = useState({
    title: '[Empty Name]',
    description: '[Empty Description]',
  });
  const [persistedTitle, setPersistedTitle] = useState('');
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
  const workflow = useWorkflowPage({
    onDeleteNodes: cleanDeletedNodeFieldBindings,
    fieldBindings: loadedFieldBindings,
    onFieldBindingsChange: setLoadedFieldBindings,
    confirmDependencyDrop: (invalidReferences) => confirm({
      title: 'Dependency conflict',
      message: `This drop breaks ${invalidReferences.length} reference${invalidReferences.length === 1 ? '' : 's'}. If you continue, broken references will be removed.`,
      confirmText: 'Continue',
      confirmVariant: 'danger',
    }),
  });
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
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
  const [connectorMappingDialogOpen, setConnectorMappingDialogOpen] = useState(false);
  const [connectorMappingGroups, setConnectorMappingGroups] = useState<ConnectorMappingGroup[]>([]);
  const [pendingTemplateApply, setPendingTemplateApply] = useState<{
    state: WorkflowConnectionState;
    selectedTemplate: Template;
  } | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [schedulesOpen, setSchedulesOpen] = useState(false);
  const hydratedNodes = useMemo(
    () => hydrateNodesWithOperationResponses(workflow.nodes, connectors, invokers),
    [connectors, invokers, workflow.nodes],
  );
  const activeConnectionId = createdConnectionId ?? connectionId;
  const displayedHistoryVersions = useMemo(
    () => applyProfileAuthor(historyVersions, authUser),
    [authUser, historyVersions],
  );
  const currentChangeSnapshot = useMemo(
    () => buildWorkflowChangeSnapshot({
      connectionId: activeConnectionId,
      title: headerState.title,
      description: toPayloadDescription(headerState.description),
      nodes: hydratedNodes,
      edges: workflow.edges,
      fieldBindings: loadedFieldBindings,
    }),
    [activeConnectionId, headerState.description, headerState.title, hydratedNodes, loadedFieldBindings, workflow.edges],
  );
  const selectedNode = hydratedNodes.find((node) => node.id === workflow.sidebarAction?.sourceNodeId) ?? null;
  const contextMenuNode = hydratedNodes.find((node) => node.id === workflow.contextMenu?.nodeId) ?? null;
  const editorNode = hydratedNodes.find((node) => node.id === workflow.methodEditor?.nodeId) ?? null;
  const conditionNode = hydratedNodes.find((node) => node.id === workflow.conditionEditor?.nodeId) ?? null;
  const aggregatorNode = hydratedNodes.find((node) => node.id === workflow.aggregatorEditor?.nodeId) ?? null;
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
    setCreatedConnectionId(undefined);
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
        setPersistedTitle(state.title);
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

  useUnsavedChangesGuard(!readOnly && hasConnectionChanges, t('messages.unsavedLeaveConfirm'));

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

  const validateTitle = useCallback(async (title: string): Promise<string | null> => {
    const trimmed = title.trim();
    if (!trimmed || trimmed === '[Empty Name]' || trimmed === persistedTitle) return null;
    const check = await apiExecutor({ url: `/connection/check/${encodeURIComponent(trimmed)}`, method: 'GET' });
    if (check && typeof check === 'object' && 'message' in check && (check as { message?: string }).message === 'EXISTS') {
      return t('messages.workflowNameExists');
    }
    return null;
  }, [persistedTitle, t]);

  // Recognizes known backend validation error codes (e.g. an operator with an empty
  // expression), highlights the node it names, and returns a specific translated
  // message — or null when the error is unrecognized, so callers fall back to their
  // own generic "failed to save/start" message. Shared between handleSave and the
  // test-run start flow (passed to TestRunProvider) since both hit the same backend
  // validation on the same node/edge graph.
  const resolveAndHighlightWorkflowError = useCallback((error: unknown): string | null => {
    const resolution = resolveWorkflowApiError(error, hydratedNodes, workflow.edges);
    if (!resolution) return null;
    const specificMessage = tEntities(resolution.messageKey, resolution.messageParams);
    if (resolution.nodeId) {
      workflow.onSetNodeError(resolution.nodeId, specificMessage);
    }
    return specificMessage;
  }, [hydratedNodes, workflow, tEntities]);

  const handleSave = async ({ title, description, comment }: { title: string; description: string; comment: string }) => {
    if (!title.trim() || title.trim() === '[Empty Name]') {
      message.error(t('messages.enterWorkflowName'));
      throw new Error('Connection name is required');
    }

    workflow.onClearNodeErrors();
    const normalizedDescription = toPayloadDescription(description);
    const isCreate = !activeConnectionId;
    let response;
    try {
      response = await saveWorkflowConnection({
        connectionId: activeConnectionId,
        title,
        description: normalizedDescription,
        comment,
        nodes: hydratedNodes,
        edges: workflow.edges,
        viewport: workflow.getViewport(),
        fieldBindings: loadedFieldBindings,
      });
    } catch (error) {
      const specificMessage = resolveAndHighlightWorkflowError(error);
      message.error(
        specificMessage ??
          tEntities(isCreate ? 'connection.messages.saveFailed.create' : 'connection.messages.saveFailed.update', { title }),
        specificMessage ? RESOLVED_WORKFLOW_ERROR_MESSAGE_DURATION_SEC : undefined,
      );
      throw error;
    }
    const savedId = (response.data as any)?.connectionId;
    const nextConnectionId = activeConnectionId ?? savedId;
    setHeaderState({ title, description: toDisplayDescription(normalizedDescription) });
    setPersistedTitle(title);
    setBaselineSnapshot(buildWorkflowChangeSnapshot({
      connectionId: nextConnectionId ? String(nextConnectionId) : activeConnectionId,
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
    if (isCreate && savedId) {
      const savedIdString = String(savedId);
      setCreatedConnectionId(savedIdString);
      window.history.replaceState(window.history.state, '', `/workflow/update/${savedIdString}`);
    }
  };

  const downloadConnectionTemplate = async () => {
    if (!activeConnectionId) return;
    setIsDownloadingTemplate(true);
    try {
      const template = (await apiExecutor({
        url: `/template/connection/${activeConnectionId}`,
        method: 'GET',
      })) as Template;
      const filename = String(template?.templateId ?? activeConnectionId);
      triggerJsonDownload(filename, template);
      message.success(tEntities('connection.list.downloadTemplate.success', { name: filename }));
    } catch {
      message.error(tEntities('connection.list.downloadTemplate.error'));
    } finally {
      setIsDownloadingTemplate(false);
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
    } catch {
      message.error(t('messages.saveTemplateFailed'));
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const fetchTemplates = async (): Promise<Template[]> => {
    const response = await apiExecutor({
      url: '/template/all?metadataOnly=true',
      method: 'GET',
    });
    const nextTemplates = Array.isArray(response) ? response : [];
    setTemplates(nextTemplates);
    return nextTemplates;
  };

  const openLoadTemplateDialog = async () => {
    setLoadTemplateDialogOpen(true);
    setSelectedTemplateId(undefined);
    setIsLoadingTemplates(true);
    try {
      await fetchTemplates();
    } catch {
      message.error(t('messages.loadTemplatesFailed'));
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const uploadTemplateInLoadDialog = async () => {
    const file = await pickConnectionTemplateFile();
    if (!file) return;

    setIsUploadingTemplate(true);
    try {
      const uploadedId = await uploadConnectionTemplate(file, () =>
        confirm({
          title: tEntities('connection-template.list.upload.confirmReplace.title'),
          message: tEntities('connection-template.list.upload.confirmReplace.message'),
        }),
      );
      if (uploadedId) {
        message.success(tEntities('connection-template.list.upload.success', { name: file.name }));
        await fetchTemplates();
        setSelectedTemplateId(String(uploadedId));
      }
    } catch (err) {
      console.error(err);
      message.error(tEntities('connection-template.list.upload.error'));
    } finally {
      setIsUploadingTemplate(false);
    }
  };

  const closeLoadTemplateDialog = () => {
    if (isApplyingTemplate) return;
    setLoadTemplateDialogOpen(false);
    setSelectedTemplateId(undefined);
  };

  const finishApplyTemplate = async (state: WorkflowConnectionState, selectedTemplate: Template) => {
    workflow.setWorkflowGraph(state.nodes, state.edges, state.viewport, { centerStart: true });
    setLoadedFieldBindings(state.fieldBindings);
    const templateName = selectedTemplate.name?.trim();
    const templateDescription = selectedTemplate.description?.trim();
    const applyTemplateNameAndDescription = () =>
      setHeaderState((prev) => ({
        title: templateName ? templateName : prev.title,
        description: templateDescription ? toDisplayDescription(templateDescription) : prev.description,
      }));

    if (isHeaderNameEmpty(headerState.title)) {
      applyTemplateNameAndDescription();
    } else {
      const shouldReplace = await confirm({
        title: t('template.replaceConfirm.title'),
        message: t('template.replaceConfirm.message'),
        confirmText: t('template.replaceConfirm.replace'),
        cancelText: t('template.replaceConfirm.keep'),
      });
      if (shouldReplace) applyTemplateNameAndDescription();
    }
    setLoadTemplateDialogOpen(false);
    setSelectedTemplateId(undefined);
    message.success(`Template "${selectedTemplate.name ?? selectedTemplate.templateId}" loaded`);
  };

  const applySelectedTemplate = async () => {
    const selectedTemplate = templates.find((template) => String(template.templateId) === selectedTemplateId);
    if (!selectedTemplate) {
      message.error(t('messages.selectTemplate'));
      return;
    }

    setIsApplyingTemplate(true);
    try {
      const fullTemplate = await apiExecutor({
        url: `/template/${encodeURIComponent(String(selectedTemplate.templateId))}`,
        method: 'GET',
      });
      if (!fullTemplate?.connection) {
        message.error(t('messages.loadTemplateFailed'));
        return;
      }
      const state = mapConnectionToWorkflowState(fullTemplate.connection);
      const groups = extractConnectorGroups(state.nodes);
      if (groups.length > 0) {
        setPendingTemplateApply({ state, selectedTemplate });
        setConnectorMappingGroups(groups);
        setConnectorMappingDialogOpen(true);
        setLoadTemplateDialogOpen(false);
        return;
      }
      await finishApplyTemplate(state, selectedTemplate);
    } catch {
      message.error(t('messages.loadTemplateFailed'));
    } finally {
      setIsApplyingTemplate(false);
    }
  };

  const handleConfirmConnectorMapping = async (mapping: Record<number, number>) => {
    if (!pendingTemplateApply) return;
    setConnectorMappingDialogOpen(false);
    setIsApplyingTemplate(true);
    try {
      const mappedNodes = applyConnectorMapping(pendingTemplateApply.state.nodes, mapping, connectors);
      await finishApplyTemplate(
        { ...pendingTemplateApply.state, nodes: mappedNodes },
        pendingTemplateApply.selectedTemplate,
      );
    } catch {
      message.error(t('messages.loadTemplateFailed'));
    } finally {
      setIsApplyingTemplate(false);
      setPendingTemplateApply(null);
      setConnectorMappingGroups([]);
    }
  };

  const handleCancelConnectorMapping = () => {
    setConnectorMappingDialogOpen(false);
    setPendingTemplateApply(null);
    setConnectorMappingGroups([]);
    setSelectedTemplateId(undefined);
  };

  const handleHeaderMenuSelect = (item: WorkflowHeaderMenuItem) => {
    if (item.id === 'download-template') {
      void downloadConnectionTemplate();
    } else if (item.id === 'save-template') {
      openSaveTemplateDialog();
    } else if (item.id === 'load-template') {
      void openLoadTemplateDialog();
    } else if (item.id === 'shortcuts') {
      setIsShortcutsOpen(true);
    } else if (item.id === 'exit') {
      navigate('/workflow');
    }
  };

  const buildTestPayload = useCallback(() => {
    workflow.onClearNodeErrors();
    const hasMethodNode = hydratedNodes.some(
      (node) => node.type === 'connector' || node.type === 'system' || node.type === 'trigger-connection',
    );
    if (!hasMethodNode) {
      message.error(tEntities('connection.test.noMethods'));
      return null;
    }
    return {
      ...buildConnectionPayload({
        connectionId,
        title: headerState.title,
        description: toPayloadDescription(headerState.description),
        nodes: hydratedNodes,
        edges: workflow.edges,
        viewport: workflow.getViewport(),
        fieldBindings: loadedFieldBindings,
      }),
      fromConnector: buildFromConnectorPayload(hydratedNodes, workflow.edges),
      toConnector: null,
    };
  }, [connectionId, headerState.description, headerState.title, hydratedNodes, loadedFieldBindings, tEntities, workflow]);

  const deleteSelectedNode = () => {
    if (readOnly) return;
    if (
      workflow.methodEditor ||
      workflow.conditionEditor ||
      workflow.aggregatorEditor ||
      workflow.historyOpen ||
      templateDialogOpen ||
      loadTemplateDialogOpen ||
      connectorMappingDialogOpen ||
      isShortcutsOpen
    ) return;
    const selected = workflow.nodes.find((node) => node.selected && node.type !== 'start');
    if (!selected) return;
    void workflow.onDeleteNode(selected.id);
  };
  const deleteSelectedNodeRef = useRef(deleteSelectedNode);
  deleteSelectedNodeRef.current = deleteSelectedNode;

  useEffect(() => {
    const handleDeleteShortcut = (event: KeyboardEvent) => {
      if (event.key !== 'Delete') return;
      const target = event.target as HTMLElement | null;
      // Don't hijack Delete while the user is editing text or a code editor.
      if (target?.closest('input, textarea, select, [contenteditable="true"], .ace_editor')) return;
      deleteSelectedNodeRef.current();
    };
    window.addEventListener('keydown', handleDeleteShortcut);
    return () => window.removeEventListener('keydown', handleDeleteShortcut);
  }, []);

  const handleOpenHistory = () => {
    workflow.setHistoryOpen(true);
    setSchedulesOpen(false);
    workflow.setSidebarAction(null);
    workflow.setContextMenu(null);
    workflow.setConditionEditor(null);
    if (activeConnectionId) {
      void loadConnectionVersions(activeConnectionId).then((nextVersions) => {
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
    <TestRunProvider connectionId={connectionId} connectionTitle={headerState.title} buildTestPayload={buildTestPayload} onResolveStartError={resolveAndHighlightWorkflowError}>
    <div className="page" data-testid="workflow-page">
      <WorkflowHeader
        initialName={headerState.title}
        initialDescription={headerState.description}
        onChange={setHeaderState}
        onMenuItemSelect={handleHeaderMenuSelect}
        menuLoadingItemId={isDownloadingTemplate ? 'download-template' : null}
        validateTitle={validateTitle}
        onSave={handleSave}
        saveDisabled={isLoading || !hasConnectionChanges}
        onOpenHistory={handleOpenHistory}
        readOnly={readOnly}
        loading={isConnectionLoading}
        schedulesSlot={
          activeConnectionId ? (
            <WorkflowSchedulesPill
              connectionId={activeConnectionId}
              open={schedulesOpen}
              onToggle={() => {
                setSchedulesOpen((prev) => {
                  if (!prev) workflow.setHistoryOpen(false);
                  return !prev;
                });
              }}
            />
          ) : null
        }
      />
      <Modal
        open={templateDialogOpen}
        title={t('template.addTitle')}
        onCancel={closeSaveTemplateDialog}
        destroyOnHidden
        width={520}
        footer={[
          <Button key="cancel" onClick={closeSaveTemplateDialog} disabled={isSavingTemplate} data-testid="workflow-save-template-cancel">
            {t('actions.cancel')}
          </Button>,
          <Button key="ok" type="primary" loading={isSavingTemplate} onClick={saveConnectionAsTemplate} data-testid="workflow-save-template-ok">
            {t('actions.ok')}
          </Button>,
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span>
              {t('template.nameLabel')}
              <span style={{ color: 'var(--color-status-error-fg)' }}> *</span>
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
              data-testid="workflow-save-template-name"
            />
            {templateNameError ? <span style={{ color: 'var(--color-status-error-fg)', fontSize: 12 }}>{templateNameError}</span> : null}
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span>{t('description.label')}</span>
            <div style={{ position: 'relative' }}>
              <Input.TextArea
                maxLength={5000}
                rows={4}
                value={templateDescription}
                onChange={(event) => setTemplateDescription(event.target.value)}
                style={{ paddingBottom: 26 }}
                data-testid="workflow-save-template-description"
              />
              <span style={{ position: 'absolute', right: 12, bottom: 6, color: 'var(--color-text-secondary)', pointerEvents: 'none' }}>
                {templateDescription.length} / 5000
              </span>
            </div>
          </label>
        </div>
      </Modal>
      <Modal
        open={loadTemplateDialogOpen}
        title={t('template.loadTitle')}
        onCancel={closeLoadTemplateDialog}
        destroyOnHidden
        width={520}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              loading={isUploadingTemplate}
              disabled={isApplyingTemplate}
              onClick={uploadTemplateInLoadDialog}
              data-testid="workflow-load-template-upload"
            >
              {tEntities('connection-template.list.upload.button')}
            </Button>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={closeLoadTemplateDialog} disabled={isApplyingTemplate} data-testid="workflow-load-template-cancel">
                {t('actions.cancel')}
              </Button>
              <Button type="primary" loading={isApplyingTemplate} onClick={applySelectedTemplate} data-testid="workflow-load-template-load">
                {t('actions.load')}
              </Button>
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ color: 'var(--color-text-secondary)' }}>
            {t('template.loadWarning')}
          </div>
          <Select
            autoFocus
            loading={isLoadingTemplates}
            value={selectedTemplateId}
            placeholder={t('template.selectPlaceholder')}
            data-testid="workflow-load-template-select"
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
      <TemplateConnectorMappingDialog
        open={connectorMappingDialogOpen}
        groups={connectorMappingGroups}
        connectors={connectors}
        invokers={invokers}
        onConfirm={handleConfirmConnectorMapping}
        onCancel={handleCancelConnectorMapping}
      />
      <ShortcutsDialog open={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
      <div className="workflowMain">
        {isLoading ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loading size="lg" />
          </div>
        ) : (
          <>
            <WorkflowCanvas
              nodes={hydratedNodes}
              edges={workflow.edges}
              isAnyNodeDragging={workflow.isAnyNodeDragging}
              restoredViewport={workflow.restoredViewport}
              viewportRestoreVersion={workflow.viewportRestoreVersion}
              centerStartVersion={workflow.centerStartVersion}
              onInit={workflow.setReactFlowInstance}
              activeAction={workflow.sidebarAction}
              onNodesChange={workflow.onNodesChange}
              onEdgesChange={workflow.onEdgesChange}
              onConnect={workflow.onConnect}
              onNodeDragStart={workflow.onNodeDragStart}
              onNodeDrag={workflow.onNodeDrag}
              onNodeDragStop={workflow.onNodeDragStop}
              onOpenAddStep={workflow.onOpenAddStep}
              onOpenContextMenu={workflow.setContextMenu}
              onNodeDoubleClick={(_, node) => {
                workflow.setSidebarAction(null);
                workflow.setContextMenu(null);
                workflow.setHistoryOpen(false);

                if (node.type === 'connector' || node.type === 'system' || node.type === 'trigger-connection') {
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
      <WorkflowSidebar action={workflow.sidebarAction} selectedNode={selectedNode} connectionId={activeConnectionId} onClose={() => workflow.setSidebarAction(null)} onSelect={workflow.onAddStep} />
      <WorkflowSchedulesPanel
        open={schedulesOpen}
        connectionId={activeConnectionId}
        connectionTitle={headerState.title}
        onClose={() => setSchedulesOpen(false)}
      />
      <HistoryPanel
        open={workflow.historyOpen}
        items={displayedHistoryVersions}
        selectedId={selectedHistoryVersionId}
        onSelectedIdChange={setSelectedHistoryVersionId}
        hasUnsavedChanges={hasManualUnsavedChanges}
        onClose={() => workflow.setHistoryOpen(false)}
        onSelectVersion={async (snapshotId) => {
          if (!activeConnectionId) return;
          setSelectedHistoryVersionId(snapshotId);
          const state = await loadWorkflowConnectionVersion(activeConnectionId, snapshotId);
          const nextNodes = hydrateNodesWithOperationResponses(state.nodes, connectors, invokers);
          const nextSnapshot = buildWorkflowChangeSnapshot({
            connectionId: activeConnectionId,
            title: state.title,
            description: toPayloadDescription(state.description),
            nodes: nextNodes,
            edges: state.edges,
            fieldBindings: state.fieldBindings,
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
          if (!activeConnectionId) return;
          await saveConnectionVersionComment(activeConnectionId, snapshotId, comment);
          setHistoryVersions(await loadConnectionVersions(activeConnectionId));
        }}
        onDeleteVersion={async (snapshotId) => {
          if (!activeConnectionId) return;
          await removeConnectionVersion(activeConnectionId, snapshotId);
          const nextVersions = await loadConnectionVersions(activeConnectionId);
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
        onShowResponse={workflow.onShowResponse}
        onOpenAggregatorEditor={(nodeId) => workflow.setAggregatorEditor({ nodeId })}
        onClose={() => workflow.setContextMenu(null)}
      />
      <ResponseDialog
        open={!!workflow.responseNodeId}
        node={hydratedNodes.find((node) => node.id === workflow.responseNodeId) ?? null}
        onClose={workflow.onCloseResponse}
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
        edges={workflow.edges}
        connection={conditionConnection}
        onClose={() => workflow.setConditionEditor(null)}
        onSave={workflow.onSaveConditionConfig}
      />
      <AggregatorConfigDialog
        open={!!workflow.aggregatorEditor}
        node={aggregatorNode}
        onClose={() => workflow.setAggregatorEditor(null)}
        onSave={workflow.onSaveDataAggregator}
      />
    </div>
    </TestRunProvider>
  );
}
