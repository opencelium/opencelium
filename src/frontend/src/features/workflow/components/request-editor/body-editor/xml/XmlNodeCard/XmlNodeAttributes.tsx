import { Button } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { XmlFieldEditor } from '../XmlFieldEditor/XmlFieldEditor';
import { getNextAttributeName } from '../xmlNodeHelpers';
import type { XmlNodeCardProps } from './XmlNodeCard.types';

type Props = Pick<XmlNodeCardProps, 'node' | 'readOnly' | 'selected' | 'onChangeNode'
	| 'onSelect' | 'onReferenceClick' | 'onInsertReference'> & {
	onEdit: (attribute: string) => void;
};

export function XmlNodeAttributes({ node, readOnly, selected, onChangeNode,
	onSelect, onReferenceClick, onInsertReference, onEdit }: Props) {
	const { t } = useI18n('workflow');
	return <>
		{Object.entries(node.attributes).map(([attribute, value]) => <XmlFieldEditor
			key={attribute} variant='attribute' label={<span className='xmlAttrLabel'>
				<span className='xmlAttrName'>@{attribute}</span><span className='xmlAttrEq'>=</span>
			</span>} value={value} placeholder={t('xmlNode.attributePlaceholder', { name: attribute })}
			selection={{ nodeId: node.id, kind: 'attribute', attribute }}
			selected={selected?.nodeId === node.id && selected.kind === 'attribute'
				&& selected.attribute === attribute} readOnly={readOnly} onSelect={onSelect}
			onChange={(next) => onChangeNode(node.id,
				{ attributes: { ...node.attributes, [attribute]: next } })}
			onRemove={() => { const next = { ...node.attributes }; delete next[attribute];
				onChangeNode(node.id, { attributes: next }); }}
			onReferenceClick={onReferenceClick} onInsertReference={onInsertReference}
			onEdit={() => onEdit(attribute)} />)}
		{!readOnly && <Button type='dashed' size='small' className='xmlAddAttribute'
			onClick={() => {
				const name = getNextAttributeName(node.attributes);
				onChangeNode(node.id, { attributes: { ...node.attributes, [name]: '' } });
				onSelect({ nodeId: node.id, kind: 'attribute', attribute: name });
			}}><span className='xmlSectionBadgeIcon'>@</span>{t('actions.addAttribute')}</Button>}
	</>;
}
