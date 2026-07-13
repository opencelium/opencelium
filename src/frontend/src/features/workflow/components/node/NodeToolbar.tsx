import { Trash2, Unlink } from 'lucide-react';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type Props = {
  canDelete?: boolean;
  onDelete?: () => void;
  canRemoveJoint?: boolean;
  onRemoveJoint?: () => void;
};

export function NodeToolbar({ canDelete, onDelete, canRemoveJoint, onRemoveJoint }: Props) {
  const { t } = useI18n('workflow');
  if (!canDelete && !canRemoveJoint) return null;

  return (
    <div className="nodeToolbar">
      {canRemoveJoint && (
        <button
          className="nodeToolbarButton"
          type="button"
          title={t('actions.removeJoint')}
          data-testid="workflow-node-remove-joint"
          onClick={onRemoveJoint}
        >
          <Unlink size={14} />
        </button>
      )}
      {canDelete && (
        <button
          className="nodeToolbarButton nodeToolbarButtonDanger"
          type="button"
          title={t('actions.delete')}
          data-testid="workflow-node-delete"
          onClick={onDelete}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
