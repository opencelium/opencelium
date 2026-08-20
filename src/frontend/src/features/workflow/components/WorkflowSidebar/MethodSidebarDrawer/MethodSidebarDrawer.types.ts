import type { SidebarListItem } from '../../sidebar/SidebarList/SidebarList.types';

export type MethodSidebarDrawerProps = {
  open: boolean;
  title: string;
  subtitle: string;
  placeholder: string;
  connectorIcon?: string | null;
  search: string;
  items: readonly SidebarListItem[];
  onSearchChange: (value: string) => void;
  onClose: () => void;
  onSelect: (key: string) => void;
};
