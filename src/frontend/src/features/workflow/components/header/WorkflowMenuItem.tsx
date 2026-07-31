import type { ReactNode } from 'react';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { Tooltip } from '@shared/ui/primitives/Tooltip';

type Props = {
  label: ReactNode;
  onClick: () => void;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
  tooltip?: ReactNode;
  badge?: ReactNode;
  testId?: string;
};

export function WorkflowMenuItem({ label, onClick, className, loading = false, disabled = false, tooltip, badge, testId }: Props) {
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
