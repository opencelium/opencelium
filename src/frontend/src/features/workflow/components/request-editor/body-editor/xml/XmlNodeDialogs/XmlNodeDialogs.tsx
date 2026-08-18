import { XmlAttributeDialog } from '../XmlAttributeDialog/XmlAttributeDialog';
import { XmlTagDialog } from '../XmlTagDialog/XmlTagDialog';
import { XmlTextDialog } from '../XmlTextDialog/XmlTextDialog';
import type { XmlNodeDialogsProps } from './XmlNodeDialogs.types';

export function XmlNodeDialogs(props: XmlNodeDialogsProps) {
  const attributeValue = props.attributeName ? props.attributes[props.attributeName] || '' : '';
  const saveAttribute = (name: string, value: string) => {
    const attributes = { ...props.attributes };
    if (props.attributeName && props.attributeName !== name) delete attributes[props.attributeName];
    attributes[name] = value;
    props.onUpdateNode(props.nodeId, { attributes });
    props.onSelectAttribute(name);
    props.onCloseAttribute();
  };

  return <>
    <XmlTagDialog open={props.isTagDialogOpen} value={props.tagName}
      onClose={props.onCloseTag} onSave={(value) => {
        props.onUpdateNode(props.nodeId, { name: value });
        props.onCloseTag();
      }} />
    <XmlTextDialog open={props.isTextDialogOpen} value={props.text}
      onClose={props.onCloseText} onSave={(value) => {
        props.onUpdateNode(props.nodeId, { text: value });
        props.onSelectText();
        props.onCloseText();
      }} />
    <XmlAttributeDialog open={Boolean(props.attributeName)} name={props.attributeName || ''}
      value={attributeValue} onClose={props.onCloseAttribute} onSave={saveAttribute} />
  </>;
}
