import type { RefObject } from 'react';
import type { ReferencePathOption } from '../../body-editor/requestReferenceOptions';
import type { DropdownPosition } from '../ReferenceGenerator.types';

export type ReferenceFieldDropdownProps = {
  open: boolean;
  position: DropdownPosition | null;
  dropdownRef: RefObject<HTMLDivElement | null>;
  options: ReferencePathOption[];
  onSelect: (option: ReferencePathOption) => void;
};
