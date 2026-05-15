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
}

export type CheckboxGroupComponent = React.FC<CheckboxGroupProps>;
