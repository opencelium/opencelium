import { XmlAttributeDialog } from './XmlAttributeDialog';
import { XmlTagDialog } from './XmlTagDialog';
import { XmlTextDialog } from './XmlTextDialog';

type Props = {
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

export function XmlNodeDialogs(props: Props) {
  const currentAttributeValue = props.attributeName ? props.attributes[props.attributeName] || '' : '';

  return (
    <>
      <XmlTagDialog
        open={props.isTagDialogOpen}
        value={props.tagName}
        onClose={props.onCloseTag}
        onSave={(value) => {
          props.onUpdateNode(props.nodeId, { name: value });
          props.onCloseTag();
        }}
      />
      <XmlTextDialog
        open={props.isTextDialogOpen}
        value={props.text}
        onClose={props.onCloseText}
        onSave={(value) => {
          props.onUpdateNode(props.nodeId, { text: value });
          props.onSelectText();
          props.onCloseText();
        }}
      />
      <XmlAttributeDialog
        open={!!props.attributeName}
        name={props.attributeName || ''}
        value={currentAttributeValue}
        onClose={props.onCloseAttribute}
        onSave={(name, value) => {
          const next = { ...props.attributes };
          if (props.attributeName && props.attributeName !== name) delete next[props.attributeName];
          next[name] = value;
          props.onUpdateNode(props.nodeId, { attributes: next });
          props.onSelectAttribute(name);
          props.onCloseAttribute();
        }}
      />
    </>
  );
}
