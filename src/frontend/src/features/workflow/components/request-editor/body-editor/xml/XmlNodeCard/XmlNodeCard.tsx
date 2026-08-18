import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import { useState } from 'react';
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { XmlFieldEditor } from '../XmlFieldEditor/XmlFieldEditor';
import { XmlNodeDialogs } from '../XmlNodeDialogs/XmlNodeDialogs';
import type { XmlTreeNode } from '../xmlTree';
import { XmlNodeAttributes } from './XmlNodeAttributes';
import type { XmlNodeCardProps } from './XmlNodeCard.types';
import '../xmlNode.css';

export function XmlNodeCard({ node, depth = 0, readOnly, selected, onChangeNode,
	onAddChild, onRemove, onSelect, onReferenceClick, onInsertReference }: XmlNodeCardProps) {
	const { t } = useI18n('workflow');
	const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
	const [editingAttribute, setEditingAttribute] = useState<string | null>(null);
	const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
	const selectedText = selected?.nodeId === node.id && selected.kind === 'text';
	const selectedNode = selected?.nodeId === node.id
		&& (selected.kind === 'text' || selected.kind === 'attribute');
	const childProps = { readOnly, selected, onChangeNode, onAddChild, onRemove,
		onSelect, onReferenceClick, onInsertReference };
	return <div className={`xmlNode ${selectedNode ? 'xmlNodeSelected' : ''}`}
		style={{ marginLeft: depth * 20 }}>
		<div className='xmlNodeHeader'>
			<div className='xmlNodeTitle'><span className='xmlBracket'>&lt;</span>
				<span className='xmlTagName'>{node.name || 'tag'}</span>
				<span className='xmlBracket'>&gt;</span>
				{!readOnly && <Button className='xmlIconButton' type='text' size='small'
					icon={<EditOutlined />} onClick={() => setIsTagDialogOpen(true)} />}
				<span className='xmlLevelBadge'>{`L${depth}`}</span>
			</div>
			{!readOnly && <Space className='xmlNodeActions'>
				<Button className='xmlAddChild' size='small' icon={<PlusOutlined />}
					onClick={() => onAddChild(node.id)}>{t('xmlNode.addChild')}</Button>
				{depth > 0 && <Tooltip content={t('actions.delete')}>
					<DeleteIconButton iconSize={14} onClick={() => onRemove(node.id)} />
				</Tooltip>}
			</Space>}
		</div>
		<div className='xmlNodeBody'>
			<XmlFieldEditor variant='text' label={<span className='xmlSectionBadge xmlSectionBadgeText'>
				{t('xmlNode.text')}</span>} value={node.text} placeholder={t('xmlNode.textPlaceholder')}
				selection={{ nodeId: node.id, kind: 'text' }} selected={selectedText} readOnly={readOnly}
				onSelect={onSelect} onChange={(text) => onChangeNode(node.id, { text })}
				onReferenceClick={onReferenceClick} onInsertReference={onInsertReference}
				onEdit={() => { onSelect({ nodeId: node.id, kind: 'text' }); setIsTextDialogOpen(true); }} />
			<XmlNodeAttributes node={node} readOnly={readOnly} selected={selected}
				onChangeNode={onChangeNode} onSelect={onSelect} onReferenceClick={onReferenceClick}
				onInsertReference={onInsertReference} onEdit={setEditingAttribute} />
			<div className='xmlChildren'>{node.children.map((child) =>
				<XmlNodeCard key={child.id} node={child} depth={depth + 1} {...childProps} />)}</div>
			<XmlNodeDialogs attributeName={editingAttribute} attributes={node.attributes}
				isTagDialogOpen={isTagDialogOpen} isTextDialogOpen={isTextDialogOpen}
				nodeId={node.id} tagName={node.name} text={node.text}
				onCloseAttribute={() => setEditingAttribute(null)} onCloseTag={() => setIsTagDialogOpen(false)}
				onCloseText={() => setIsTextDialogOpen(false)}
				onSelectAttribute={(name) => onSelect({ nodeId: node.id, kind: 'attribute', attribute: name })}
				onSelectText={() => onSelect({ nodeId: node.id, kind: 'text' })}
				onUpdateNode={(id, patch) => onChangeNode(id, patch as Partial<XmlTreeNode>)} />
		</div>
	</div>;
}
