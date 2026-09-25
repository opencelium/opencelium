import type { RefObject } from 'react';
import type { DropdownPosition, ReferenceOption } from '../ReferenceGenerator.types';

export type ReferenceFieldDropdownProps = {
  open: boolean;
  position: DropdownPosition | null;
  dropdownRef: RefObject<HTMLDivElement | null>;
  options: ReferenceOption[];
  onSelect: (option: ReferenceOption) => void;
};
