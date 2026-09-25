import type { BodySelection } from '../../body-editor/bodyValue';

export type RequestFieldInspectorProps = {
  title: string;
  selection: BodySelection | null;
  value: unknown;
  readOnly?: boolean;
  onInsertReference: () => void;
  onClear: () => void;
  onChangeReferences: (next: string) => void;
};
