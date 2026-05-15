import type { RefObject } from 'react';

type Props = {
  inputRef: RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
};

export function ContextMenuEditor({ inputRef, value, onChange, onCancel, onSave }: Props) {
  return (
    <div className="contextMenuEditor">
      <input
        ref={inputRef}
        className="contextMenuInput"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => event.key === 'Enter' && onSave()}
        placeholder="New label"
      />
      <div className="contextMenuActions">
        <button className="contextMenuActionButton" type="button" onClick={onCancel}>Cancel</button>
        <button className="contextMenuActionButton contextMenuActionButtonPrimary" type="button" onClick={onSave}>Save</button>
      </div>
    </div>
  );
}
