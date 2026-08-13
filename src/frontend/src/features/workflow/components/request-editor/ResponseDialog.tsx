import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Button, Modal } from 'antd';
import ReactJson from 'react-json-view';
import { useTheme } from '@shared/theme/hooks/useTheme';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Collapse } from '@shared/ui/primitives/Collapse';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { Typography } from '@shared/ui/primitives/Typography';
import type { CollapseItem } from '@shared/ui/primitives/Collapse/Collapse.types';
import {
  MethodDetailViewStateProvider,
  MethodLogDetails,
  resolveTraceTarget,
  type LiveLogTree,
} from '@features/logs';
import type { WorkflowNodeModel } from '../../types/workflow.types';
import type { MethodResponse } from '../../types/connection';
import { useTestRun } from '../../test-run/useTestRun';
import { resolveCurrentLoopIndex, type LiveGraphStatus } from '../../test-run/liveGraphStatus';
import '../dialogHeader.css';
import './response-dialog.css';

type Props = {
  open: boolean;
  node: WorkflowNodeModel | null;
  // nodeId -> workflow tree-path index (see index.tsx's nodeIndexById) and
  // indexPath -> enclosing-LOOP-ancestor indexPaths (outermost first) — both
  // needed to correlate this canvas node with its live execution element.
  nodeIndexById: Map<string, string>;
  loopAncestorsByIndexPath: Map<string, string[]>;
  onClose: () => void;
};

const PatchedReactJson = ReactJson as unknown as React.ComponentType<Record<string, unknown>>;

// While paused, a node that actually ran this test can show what really
// happened instead of the static sample response configured on the
// connector — same data, same endpoint (getMethodDetails) as expanding a row
// in the Execution Logs panel, resolved via the same resolveTraceTarget walk
// used there (see prefetchPauseTracePath), just anchored to whichever node
// was double-clicked/right-clicked rather than the exact paused-on step —
// which is why the loop-iteration context has to be derived from
// liveGraphStatus's per-loop "current iteration" (resolveCurrentLoopIndex)
// instead of reusing TestRunContext.currentStep (that's only ever the ONE
// step the animation is frozen on).
function useLiveResponseLookup(
  open: boolean,
  node: WorkflowNodeModel | null,
  indexPath: string | undefined,
  isPaused: boolean,
  liveGraphStatus: LiveGraphStatus | undefined,
  logTree: LiveLogTree | undefined,
  loopAncestorsByIndexPath: Map<string, string[]>,
): { liveElementId: string | null; isResolving: boolean } {
  const nodeStatus = indexPath ? liveGraphStatus?.[indexPath] : undefined;
  const hasLiveExecution =
    open && isPaused && !!indexPath && !!logTree && (nodeStatus?.status === 'COMPLETE' || nodeStatus?.status === 'FAIL');
  const loopIndex =
    indexPath && liveGraphStatus ? resolveCurrentLoopIndex(indexPath, loopAncestorsByIndexPath, liveGraphStatus) : '';
  const sessionKey = hasLiveExecution && node ? `${node.id}:${indexPath}:${loopIndex}` : null;

  const [state, setState] = useState<{ sessionKey: string | null; id: string | null; resolving: boolean }>({
    sessionKey: null,
    id: null,
    resolving: false,
  });
  const activeSessionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!sessionKey || !indexPath || !logTree) return;
    if (activeSessionRef.current === sessionKey) return;
    activeSessionRef.current = sessionKey;
    setState({ sessionKey, id: null, resolving: true });
    // No separate `cancelled` flag here — see useLiveReferenceValue.ts's
    // comment on the exact same pattern for why activeSessionRef alone is
    // the correct (and only correct) staleness check.
    void resolveTraceTarget(logTree, { indexPath, loopIndex }, [{ indexPath, loopIndex }]).then((leaf) => {
      if (activeSessionRef.current !== sessionKey) return;
      setState({ sessionKey, id: leaf?.type === 'OPERATION' ? leaf.id : null, resolving: false });
    });
  }, [sessionKey, indexPath, loopIndex, logTree]);

  if (!hasLiveExecution) return { liveElementId: null, isResolving: false };
  if (state.sessionKey !== sessionKey) return { liveElementId: null, isResolving: true };
  return { liveElementId: state.id, isResolving: state.resolving };
}

export function ResponseDialog({ open, node, nodeIndexById, loopAncestorsByIndexPath, onClose }: Props) {
  const { t } = useI18n('workflow');
  const { themeMode } = useTheme();
  const testRun = useTestRun();

  const indexPath = node ? nodeIndexById.get(node.id) : undefined;
  const isPaused = testRun?.isPaused ?? false;
  const { liveElementId, isResolving } = useLiveResponseLookup(
    open,
    node,
    indexPath,
    isPaused,
    testRun?.liveGraphStatus,
    testRun?.logTree,
    loopAncestorsByIndexPath,
  );

  if (!open || !node) return null;

  if (isResolving) {
    return (
      <Modal
        open={open}
        onCancel={onClose}
        width="94vw"
        style={{ top: 18 }}
        destroyOnHidden
        title={t('methodConfig.response')}
        className="wfDialog"
        closeIcon={<span className="wfDialogClose">×</span>}
        footer={[
          <Button key="close" type="primary" onClick={onClose} data-testid="workflow-response-dialog-close">
            {t('actions.close')}
          </Button>,
        ]}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loading size="md" />
        </div>
      </Modal>
    );
  }

  if (liveElementId) {
    return (
      <Modal
        open={open}
        onCancel={onClose}
        width="94vw"
        style={{ top: 18 }}
        destroyOnHidden
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {t('methodConfig.response')}
            <Typography variant="caption" isSubtle isBold>
              {t('methodConfig.liveBadge')}
            </Typography>
          </span>
        }
        className="wfDialog"
        closeIcon={<span className="wfDialogClose">×</span>}
        styles={{ body: { paddingTop: 8, height: 'calc(100vh - 191px)', overflow: 'auto' } }}
        footer={[
          <Button key="close" type="primary" onClick={onClose} data-testid="workflow-response-dialog-close">
            {t('actions.close')}
          </Button>,
        ]}
      >
        <div data-testid="workflow-response-dialog-live">
          <MethodDetailViewStateProvider>
            <MethodLogDetails id={liveElementId} depth={0} path={`response-dialog:${node.id}`} />
          </MethodDetailViewStateProvider>
        </div>
      </Modal>
    );
  }

  const config = node.data.methodConfig;
  const response = config?.response;
  const rjvTheme = themeMode === 'dark' ? 'twilight' : 'rjv-default';

  const renderJson = (src: unknown) => (
    <div className="responseJsonWrap">
      <PatchedReactJson
        name={false}
        src={(src && typeof src === 'object' ? src : {}) as Record<string, unknown>}
        collapsed={false}
        enableClipboard={false}
        displayDataTypes={false}
        displayObjectSize={false}
        onEdit={false}
        onAdd={false}
        onDelete={false}
        theme={rjvTheme}
        style={{ background: 'transparent', fontSize: 13, wordBreak: 'break-word', padding: '4px 0' }}
      />
    </div>
  );

  const headerItems = (result?: MethodResponse): CollapseItem[] => [
    { key: 'header', label: t('methodConfig.header'), content: renderJson(result?.header ?? {}) },
  ];
  const bodyItems = (result?: MethodResponse): CollapseItem[] => [
    { key: 'body', label: t('methodConfig.body'), content: renderJson(result?.body?.fields ?? {}) },
  ];

  const column = (title: string, result?: MethodResponse) => (
    <div className="responseColumn">
      <div className="responseColumnTitle">{title}</div>
      <div className="responseStatusField">
        <div className="responseStatusLabel">{t('response.status')}</div>
        <div className="responseStatusValue">{result?.status ?? ''}</div>
      </div>
      <Collapse items={headerItems(result)} defaultActiveKeys={[]} />
      <Collapse items={bodyItems(result)} defaultActiveKeys={['body']} />
    </div>
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width="94vw"
      style={{ top: 18 }}
      destroyOnHidden
      title={t('methodConfig.response')}
      className="wfDialog"
      closeIcon={<span className="wfDialogClose">×</span>}
      styles={{ body: { paddingTop: 8, height: 'calc(100vh - 191px)', overflow: 'auto' } }}
      footer={[
        <Button key="close" type="primary" onClick={onClose} data-testid="workflow-response-dialog-close">
          {t('actions.close')}
        </Button>,
      ]}
    >
      <div className="responseColumns" data-testid="workflow-response-dialog">
        {column(t('response.success'), response?.success)}
        {column(t('response.fail'), response?.fail)}
      </div>
    </Modal>
  );
}
