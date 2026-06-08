import { Trash2 } from 'lucide-react';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type Props = {
  canDelete?: boolean;
  onDelete?: () => void;
};

export function NodeToolbar({ canDelete, onDelete }: Props) {
  const { t } = useI18n('workflow');
  if (!canDelete) return null;

  return (
    <div className="nodeToolbar">
      <button
        className="nodeToolbarButton nodeToolbarButtonDanger"
        type="button"
        title={t('actions.delete')}
        onClick={onDelete}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
