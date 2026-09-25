export type RequestObjectEditorComponentProps = {
  messageProperty: 'body' | 'header';
  readOnly?: boolean;
  source: Record<string, unknown>;
  title: string;
};
