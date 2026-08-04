import React from "react";

export interface CheckboxOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface CheckboxGroupProps {
  value?: string[];
  options: CheckboxOption[];

  onChange?: (value: string[]) => void;

  direction?: 'vertical' | 'horizontal';
  error?: boolean;
  /** Stable selector prefix for e2e tests; each option emits `${testId}-${value}`. */
  testId?: string;
}

export type CheckboxGroupComponent = React.FC<CheckboxGroupProps>;
