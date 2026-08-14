export type XmlTextDialogProps = {
  open: boolean;
  value: string;
  onClose: () => void;
  onSave: (value: string) => void;
};
