export type XmlNodeDialogsProps = {
  attributeName: string | null;
  attributes: Record<string, string>;
  isTagDialogOpen: boolean;
  isTextDialogOpen: boolean;
  nodeId: string;
  tagName: string;
  text: string;
  onCloseAttribute: () => void;
  onCloseTag: () => void;
  onCloseText: () => void;
  onSelectAttribute: (name: string) => void;
  onSelectText: () => void;
  onUpdateNode: (nodeId: string, patch: Record<string, unknown>) => void;
};
