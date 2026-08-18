import { CloseOutlined } from '@ant-design/icons';
import { Button, Tag } from 'antd';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { getParsedReferences, splitReferences } from '../../bodyReference';
import type { XmlReferenceTokensProps } from './XmlReferenceTokens.types';
import { getXmlReferenceLabel } from './xmlReferenceTokens.utils';

export function XmlReferenceTokens({ value, onChange, onClick, readOnly }: XmlReferenceTokensProps) {
  const confirm = useConfirm();
  const { t } = useI18n('workflow');
  const references = splitReferences(value);
  if (!references.length) return null;

  const remove = async (index: number) => {
    const confirmed = await confirm({
      title: t('references.confirmDelete.title'),
      message: t('references.confirmDelete.message'),
    });
    if (confirmed) onChange(references.filter((_, current) => current !== index).join('; '));
  };

  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
    {references.map((reference, index) => <Tag key={`${reference}-${index}`}
      color={getParsedReferences(reference)[0]?.color || 'blue'}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
        cursor: onClick ? 'pointer' : 'default', marginInlineEnd: 0 }} onClick={onClick}>
      <span>{getXmlReferenceLabel(reference)}</span>
      {!readOnly && <Button type="text" size="small" icon={<CloseOutlined />}
        onClick={(event) => {
          event.stopPropagation();
          void remove(index);
        }}
        style={{ width: 16, height: 16, minWidth: 16, padding: 0, color: 'inherit' }} />}
    </Tag>)}
  </div>;
}
