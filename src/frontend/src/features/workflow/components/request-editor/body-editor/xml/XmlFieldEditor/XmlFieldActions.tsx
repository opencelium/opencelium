import { Button, Space } from 'antd';
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { setLastBodyReferenceTriggerRect } from '../../InlineBodyReferenceEditor/InlineBodyReferenceEditor';
import type { XmlFieldEditorProps } from './XmlFieldEditor.types';

type Props = Pick<XmlFieldEditorProps,
  'selection' | 'onSelect' | 'onInsertReference' | 'onEdit' | 'onRemove'>;

export function XmlFieldActions({ selection, onSelect, onInsertReference, onEdit, onRemove }: Props) {
  const { t } = useI18n('workflow');
  const insertReference = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const container = event.currentTarget.closest('.bodyLegacyLeft') as HTMLElement | null;
    const containerRect = container?.getBoundingClientRect();
    setLastBodyReferenceTriggerRect({
      left: rect.left, top: rect.top, width: rect.width, height: rect.height,
      containerLeft: containerRect?.left, containerRight: containerRect?.right,
    });
    onSelect(selection);
    onInsertReference?.(selection);
  };

  return <Space size={4} className="xmlFieldActions">
    {onInsertReference && <Button className="xmlActionButton" size="small" type="text"
      onClick={insertReference}>{t('actions.insertReference')}</Button>}
    {onEdit && <Button className="xmlActionButton" size="small" type="text"
      onClick={onEdit}>{t('actions.edit')}</Button>}
    {onRemove && <Tooltip content={t('actions.delete')}>
      <DeleteIconButton iconSize={14} onClick={onRemove} />
    </Tooltip>}
  </Space>;
}
