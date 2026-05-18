import { Trash2 } from 'lucide-react';

type Props = {
  canDelete?: boolean;
  onDelete?: () => void;
};

export function NodeToolbar({ canDelete, onDelete }: Props) {
  if (!canDelete) return null;

  return (
    <div className="nodeToolbar">
      <button
        className="nodeToolbarButton nodeToolbarButtonDanger"
        type="button"
        title="Delete"
        onClick={onDelete}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
