import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import { useState } from 'react';
import { XmlFieldEditor } from './XmlFieldEditor';
import { XmlNodeDialogs } from './XmlNodeDialogs';
import type { XmlSelection, XmlTreeNode } from './xmlTree';
import { getNextAttributeName } from './xmlNodeHelpers';
import './xmlNode.css';

type Props = {
  node: XmlTreeNode;
  depth?: number;
  readOnly?: boolean;
  selected?: XmlSelection | null;
  onChangeNode: (nodeId: string, patch: Partial<XmlTreeNode>) => void;
  onAddChild: (nodeId: string) => void;
  onRemove: (nodeId: string) => void;
  onSelect: (selection: XmlSelection) => void;
  onReferenceClick?: (selection: XmlSelection) => void;
  onInsertReference?: (selection: XmlSelection) => void;
};

export function XmlNodeCard({ node, depth = 0, readOnly, selected, onChangeNode, onAddChild, onRemove, onSelect, onReferenceClick, onInsertReference }: Props) {
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<string | null>(null);
  const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
  const selectedText = selected?.nodeId === node.id && selected.kind === 'text';
  const hasSelectedAttribute = selected?.nodeId === node.id && selected.kind === 'attribute';
  const isNodeSelected = selectedText || hasSelectedAttribute;

  return (
    <div className={`xmlNode ${isNodeSelected ? 'xmlNodeSelected' : ''}`} style={{ marginLeft: depth * 20 }}>
      <div className="xmlNodeHeader">
        <div className="xmlNodeTitle">
          <span className="xmlBracket">&lt;</span>
          <span className="xmlTagName">{node.name || 'tag'}</span>
          <span className="xmlBracket">&gt;</span>
          <span className="xmlMeta">level {depth}</span>
          {!readOnly ? <Button className="xmlIconButton" type="text" size="small" icon={<EditOutlined />} onClick={() => setIsTagDialogOpen(true)} /> : null}
        </div>
        {!readOnly ? (
          <Space className="xmlNodeActions">
            <Button className="xmlIconButton" type="text" icon={<PlusOutlined />} onClick={() => onAddChild(node.id)} />
            {depth > 0 ? <Button className="xmlIconButton" danger type="text" icon={<DeleteOutlined />} onClick={() => onRemove(node.id)} /> : null}
          </Space>
        ) : null}
      </div>
      <div className="xmlNodeBody">
        <XmlFieldEditor
          label="Text"
          value={node.text}
          placeholder="Text value"
          selection={{ nodeId: node.id, kind: 'text' }}
          selected={selectedText}
          readOnly={readOnly}
          onSelect={onSelect}
          onChange={(next) => onChangeNode(node.id, { text: next })}
          onReferenceClick={onReferenceClick}
          onInsertReference={onInsertReference}
          onEdit={() => {
            onSelect({ nodeId: node.id, kind: 'text' });
            setIsTextDialogOpen(true);
          }}
        />
        {Object.entries(node.attributes).map(([attribute, value]) => (
          <XmlFieldEditor
            key={attribute}
            label={`@${attribute}`}
            value={value}
            placeholder={`Attribute ${attribute}`}
            selection={{ nodeId: node.id, kind: 'attribute', attribute }}
            selected={selected?.nodeId === node.id && selected.kind === 'attribute' && selected.attribute === attribute}
            readOnly={readOnly}
            onSelect={onSelect}
            onChange={(next) => onChangeNode(node.id, { attributes: { ...node.attributes, [attribute]: next } })}
            onRemove={() => {
              const next = { ...node.attributes };
              delete next[attribute];
              onChangeNode(node.id, { attributes: next });
            }}
            onReferenceClick={onReferenceClick}
            onInsertReference={onInsertReference}
            onEdit={() => setEditingAttribute(attribute)}
          />
        ))}
        {!readOnly ? (
          <Button
            type="dashed"
            size="small"
            className="xmlAddAttribute"
            onClick={() => {
              const name = getNextAttributeName(node.attributes);
              onChangeNode(node.id, { attributes: { ...node.attributes, [name]: '' } });
              onSelect({ nodeId: node.id, kind: 'attribute', attribute: name });
            }}
          >
            Add attribute
          </Button>
        ) : null}
        <div className="xmlChildren">
          {node.children.map((child) => (
            <XmlNodeCard
              key={child.id}
              node={child}
              depth={depth + 1}
              readOnly={readOnly}
              selected={selected}
              onChangeNode={onChangeNode}
              onAddChild={onAddChild}
              onRemove={onRemove}
              onSelect={onSelect}
              onReferenceClick={onReferenceClick}
              onInsertReference={onInsertReference}
            />
          ))}
        </div>
        <XmlNodeDialogs
          attributeName={editingAttribute}
          attributes={node.attributes}
          isTagDialogOpen={isTagDialogOpen}
          isTextDialogOpen={isTextDialogOpen}
          nodeId={node.id}
          tagName={node.name}
          text={node.text}
          onCloseAttribute={() => setEditingAttribute(null)}
          onCloseTag={() => setIsTagDialogOpen(false)}
          onCloseText={() => setIsTextDialogOpen(false)}
          onSelectAttribute={(name) => onSelect({ nodeId: node.id, kind: 'attribute', attribute: name })}
          onSelectText={() => onSelect({ nodeId: node.id, kind: 'text' })}
          onUpdateNode={(nodeId, patch) => onChangeNode(nodeId, patch as Partial<XmlTreeNode>)}
        />
      </div>
    </div>
  );
}
