import type { NewFeatureId } from '@shared/ui/feedback/NewFeature/newFeatures';
import type { IconName } from '@shared/ui/primitives/Icon/Icon.types';

export type NodeMenuActionId = 'change-label' | 'change-connector' | 'change-connector-image'
  | 'configure-aggregator' | 'open-config' | 'edit-url' | 'edit-headers' | 'edit-body'
  | 'try-request' | 'show-response';

export type NodeMenuAction = { id: NodeMenuActionId; labelKey: string; icon: IconName; newFeatureId?: NewFeatureId };

export type NodeMenuRow =
  | { kind: 'action'; action: NodeMenuAction }
  // Closely related actions share one row as compact buttons (the three request editors).
  | { kind: 'inline'; id: string; labelKey: string; icon: IconName; actions: NodeMenuAction[] }
  // Rarely used actions fold under one row that expands in place.
  | { kind: 'submenu'; id: string; labelKey: string; icon: IconName; actions: NodeMenuAction[] };

export type NodeMenuSection = { id: string; rows: NodeMenuRow[] };

const action = (item: NodeMenuAction): NodeMenuRow => ({ kind: 'action', action: item });

const changeLabel = action({ id: 'change-label', labelKey: 'contextMenu.changeLabel', icon: 'edit' });
const configureAggregator = action({ id: 'configure-aggregator', labelKey: 'contextMenu.configureAggregator', icon: 'aggregator' });
const changeConnector: NodeMenuAction = { id: 'change-connector', labelKey: 'contextMenu.changeConnector', icon: 'arrow-switch' };
const connectorImage: NodeMenuAction = { id: 'change-connector-image', labelKey: 'contextMenu.changeConnectorImage', icon: 'image' };

const requestRow: NodeMenuRow = { kind: 'inline', id: 'request', labelKey: 'contextMenu.request', icon: 'http-request', actions: [
  { id: 'edit-url', labelKey: 'contextMenu.url', icon: 'link' },
  { id: 'edit-headers', labelKey: 'contextMenu.header', icon: 'list' },
  { id: 'edit-body', labelKey: 'contextMenu.body', icon: 'code' },
] };
const tryRequest = action({ id: 'try-request', labelKey: 'contextMenu.tryRequest', icon: 'send', newFeatureId: 'workflow-test-method' });
const responseSection: NodeMenuSection = { id: 'response',
  rows: [action({ id: 'show-response', labelKey: 'contextMenu.showResponse', icon: 'eye' })] };

const operatorMenu: NodeMenuSection[] = [
  { id: 'main', rows: [action({ id: 'open-config', labelKey: 'contextMenu.openConfiguration', icon: 'settings' }), configureAggregator] },
];

// Only a connector node draws its connector's image; a system node shows a globe.
const connectorMenu: NodeMenuSection[] = [
  { id: 'request', rows: [requestRow, tryRequest] },
  responseSection,
  { id: 'main', rows: [changeLabel, { kind: 'submenu', id: 'connector', labelKey: 'contextMenu.connector', icon: 'connector',
    actions: [changeConnector, connectorImage] }, configureAggregator] },
];

const systemMenu: NodeMenuSection[] = [
  { id: 'request', rows: [requestRow, tryRequest] },
  responseSection,
  { id: 'main', rows: [changeLabel, action(changeConnector), configureAggregator] },
];

// A trigger-connection node calls another workflow's webhook — it has no connector to swap,
// and no Try Request entry: trying it would start that other workflow for real.
const triggerConnectionMenu: NodeMenuSection[] = [
  { id: 'request', rows: [requestRow] },
  responseSection,
  { id: 'main', rows: [changeLabel, configureAggregator] },
];

export const menuByType: Record<string, NodeMenuSection[]> = {
  connector: connectorMenu,
  system: systemMenu,
  'trigger-connection': triggerConnectionMenu,
  if: operatorMenu,
  loop: operatorMenu,
};

// Drops the actions the user may not run; a group left with one action shows it directly.
export function filterMenuSections(sections: NodeMenuSection[], canRun: (id: NodeMenuActionId) => boolean) {
  const filterRow = (row: NodeMenuRow): NodeMenuRow | null => {
    if (row.kind === 'action') return canRun(row.action.id) ? row : null;
    const actions = row.actions.filter(({ id }) => canRun(id));
    if (!actions.length) return null;
    return row.kind === 'submenu' && actions.length === 1 ? action(actions[0]) : { ...row, actions };
  };
  return sections
    .map((section) => ({ ...section, rows: section.rows.map(filterRow).filter((row): row is NodeMenuRow => !!row) }))
    .filter((section) => section.rows.length > 0);
}
