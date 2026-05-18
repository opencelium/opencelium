import { Check, X } from 'lucide-react';
import type { RefObject } from 'react';

type Props = {
  className: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
};

export function HeaderEditableField({
  className,
  value,
  onChange,
  onSubmit,
  onCancel,
  inputRef,
}: Props) {
  return (
    <div className="headerInlineEditor">
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
