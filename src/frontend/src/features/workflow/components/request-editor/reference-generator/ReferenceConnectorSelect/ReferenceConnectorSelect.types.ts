import type { RefObject } from 'react';

export type ReferenceConnectorSelectProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  label: string;
  value: string;
  placeholder: string;
  open: boolean;
  disabled: boolean;
  onToggle: () => void;
};
