import type { ReactNode } from 'react';
import type { XmlSelection } from '../xmlTree';

export type XmlFieldEditorProps = {
  label: ReactNode;
  value: string;
  selection: XmlSelection;
  selected?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  variant?: 'text' | 'attribute';
  onSelect: (selection: XmlSelection) => void;
  onChange: (value: string) => void;
  onRemove?: () => void;
  onReferenceClick?: (selection: XmlSelection) => void;
  onInsertReference?: (selection: XmlSelection) => void;
  onEdit?: () => void;
};
