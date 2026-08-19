export type XmlAttributeDialogProps = {
  open: boolean;
  name: string;
  value: string;
  onClose: () => void;
  onSave: (name: string, value: string) => void;
};
