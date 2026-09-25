import { Button } from 'antd';
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Conjunction } from '../conditionBuilder.types';
import { appendChildToGroup, createEmptyGroup, createEmptyRule,
  updateGroupConjunction } from '../conditionBuilder.utils';
import type { GroupEditorProps } from './GroupEditor.types';

type Props = Pick<GroupEditorProps, 'group' | 'operatorType' | 'onDelete' | 'onChange'>;

export function GroupEditorHeader({ group, operatorType, onDelete, onChange }: Props) {
  const { t } = useI18n('workflow');
  const items = group.items || [];
  const conjunction = group.properties?.conjunction;
  const toggle = (value: Conjunction) => onChange(updateGroupConjunction(
    group, group.id, conjunction === value ? undefined : value));

  return <div className="conditionGroupHeader">
    <div className="conditionGroupStatus"><div className="conditionGroupToggle">
      <button disabled={items.length <= 1} type="button"
        className={conjunction === Conjunction.AND ? 'active' : ''}
        onClick={() => toggle(Conjunction.AND)}>AND</button>
      <button disabled={items.length <= 1} type="button"
        className={conjunction === Conjunction.OR ? 'active' : ''}
        onClick={() => toggle(Conjunction.OR)}>OR</button>
    </div>{group.error && <div className="conditionGroupError">{group.error}</div>}</div>
    <div className="conditionGroupActions">
      <Button type="primary" className="conditionGroupAddButton"
        data-testid="workflow-condition-add-condition"
        onClick={() => onChange(appendChildToGroup(group, group.id, createEmptyRule()))}>
        {t('conditionBuilder.addCondition')}</Button>
      <Button type="primary" className="conditionGroupAddButton"
        data-testid="workflow-condition-add-group"
        onClick={() => onChange(appendChildToGroup(group, group.id, createEmptyGroup(operatorType)))}>
        {t('conditionBuilder.addGroup')}</Button>
      {onDelete && <Tooltip content={t('actions.delete')}>
        <DeleteIconButton iconSize={14} onClick={onDelete} /></Tooltip>}
    </div>
  </div>;
}
