import type { SidebarListItem } from '../../sidebar/SidebarList/SidebarList.types';

export type MainSidebarDrawerProps = {
  open: boolean;
  shifted: boolean;
  shiftedFar: boolean;
  sourceNodeLabel: string;
  search: string;
  hasSearch: boolean;
  isFetching: boolean;
  defaultItems: readonly SidebarListItem[];
  connectorItems: readonly SidebarListItem[];
  operatorItems: readonly SidebarListItem[];
  methodItems: readonly SidebarListItem[];
  onSearchChange: (value: string) => void;
  onClose: () => void;
  onSelectMain: (key: string) => void;
  onSelectConnector: (key: string) => void;
  onSelectOperator: (key: string) => void;
  onSelectMethod: (key: string) => void;
};
