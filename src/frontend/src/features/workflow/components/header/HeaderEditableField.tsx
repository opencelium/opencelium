import { Check, X } from 'lucide-react';
import type { RefObject } from 'react';

type Props = {
  className: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onBlur?: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
};

export function HeaderEditableField({
  className,
  value,
  onChange,
  onSubmit,
  onCancel,
  onBlur,
  inputRef,
}: Props) {
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
      <button className="headerInlineAction" type="button" onClick={onSubmit}>
        <Check size={14} />
      </button>
      <button className="headerInlineAction" type="button" onClick={onCancel}>
        <X size={14} />
      </button>
    </div>
  );
}
