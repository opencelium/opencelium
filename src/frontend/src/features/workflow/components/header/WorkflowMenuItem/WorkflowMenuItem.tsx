import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { WorkflowMenuItemProps } from './WorkflowMenuItem.types';

export function WorkflowMenuItem({ label, onClick, className, loading = false, disabled = false, tooltip, badge, testId }: WorkflowMenuItemProps) {
  const button = (
    <button
      className={className}
      type="button"
      disabled={disabled || loading}
      data-testid={testId}
      onClick={onClick}
    >
      <span>{label}</span>
      {badge}
      {loading ? <Loading inline size="xs" /> : null}
    </button>
  );

  return tooltip ? <Tooltip content={tooltip} placement="left">{button}</Tooltip> : button;
}
