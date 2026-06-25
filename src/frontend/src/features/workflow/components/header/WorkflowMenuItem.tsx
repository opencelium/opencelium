import type { ReactNode } from 'react';
import { Loading } from '@shared/ui/primitives/Loading/Loading';

type Props = {
  label: ReactNode;
  onClick: () => void;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
  /** Small badge rendered to the right of the label (e.g. "In development"). */
  badge?: ReactNode;
  testId?: string;
};

/**
 * Shared dropdown menu item used by the workflow header and history menus.
 * When `loading` is set it renders a spinner on the right of the label and
 * blocks further clicks while the action is in flight.
 */
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
