import { Check, Loader2, X } from 'lucide-react';
import type { RefObject } from 'react';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type Props = {
  className: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onBlur?: () => void;
  loading?: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
};

export function HeaderEditableField({
  className,
  value,
  onChange,
  onSubmit,
  onCancel,
  onBlur,
  loading = false,
  inputRef,
}: Props) {
  const { t } = useI18n('workflow');

  return (
    <div
      className="headerInlineEditor"
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        onBlur?.();
      }}
    >
      <input
        ref={inputRef}
        className={`headerInlineInput ${className}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onSubmit();
          if (event.key === 'Escape') onCancel();
        }}
      />
      <Tooltip content={t('actions.confirm')}>
        <button
          className="logsHeaderIconButton"
          type="button"
          onClick={onSubmit}
          disabled={loading}
          aria-label={t('actions.confirm')}
        >
          {loading ? <Loader2 size={15} className="logsRunningSpinner" /> : <Check size={15} />}
        </button>
      </Tooltip>
      <Tooltip content={t('actions.cancel')}>
        <button
          className="logsHeaderIconButton"
          type="button"
          onClick={onCancel}
          disabled={loading}
          aria-label={t('actions.cancel')}
        >
          <X size={15} />
        </button>
      </Tooltip>
    </div>
  );
}
