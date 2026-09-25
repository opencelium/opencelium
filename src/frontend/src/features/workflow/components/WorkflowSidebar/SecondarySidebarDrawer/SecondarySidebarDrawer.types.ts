import type { SidebarListItem, SidebarListProps } from '../../sidebar/SidebarList/SidebarList.types';
import type { TriggerConnectionPanelItem } from '../../sidebar/TriggerConnectionPanel/TriggerConnectionPanel.types';
import type { SecondarySidebarMode } from '../../sidebar/sidebarSecondary';

export type SecondarySidebarDrawerProps = {
  mode: SecondarySidebarMode | null;
  title: string;
  subtitle: string;
  placeholder: string;
  search: string;
  shifted: boolean;
  connectorsFetching: boolean;
  connectorsError: boolean;
  connectorItems: readonly SidebarListItem[];
  connectorUpdateAction: SidebarListProps['updateAction'];
  /** Opens the connector create form; offered above the list, so it is reachable
   * from the empty state too. */
  onCreateConnector: () => void;
  operatorItems: readonly SidebarListItem[];
  triggerItems: TriggerConnectionPanelItem[];
  triggerFetching: boolean;
  triggerError: boolean;
  onSearchChange: (value: string) => void;
  onClose: () => void;
  onSelectConnector: (key: string) => void;
  onSelectOperator: (key: string) => void;
  onSelectTrigger: (key: string) => void;
};
