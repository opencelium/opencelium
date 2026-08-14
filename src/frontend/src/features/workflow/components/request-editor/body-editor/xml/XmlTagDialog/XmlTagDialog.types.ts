export type XmlTagDialogProps = {
  open: boolean;
  value: string;
  onClose: () => void;
  onSave: (value: string) => void;
};
