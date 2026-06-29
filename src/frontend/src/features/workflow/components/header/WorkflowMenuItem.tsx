import type { ReactNode } from 'react';
import { Loading } from '@shared/ui/primitives/Loading/Loading';

type Props = {
  label: ReactNode;
  onClick: () => void;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
  badge?: ReactNode;
  testId?: string;
};

export function WorkflowMenuItem({ label, onClick, className, loading = false, disabled = false, badge, testId }: Props) {
  return (
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
}
