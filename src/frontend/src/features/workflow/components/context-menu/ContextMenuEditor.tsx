import type { RefObject } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type Props = {
  inputRef: RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
};

export function ContextMenuEditor({ inputRef, value, onChange, onCancel, onSave }: Props) {
  const { t } = useI18n('workflow');
  return (
    <div className="contextMenuEditor">
      <input
        ref={inputRef}
        className="contextMenuInput"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => event.key === 'Enter' && onSave()}
        placeholder={t('contextMenu.newLabelPlaceholder')}
      />
      <div className="contextMenuActions">
        <button className="contextMenuActionButton" type="button" onClick={onCancel}>{t('actions.cancel')}</button>
        <button className="contextMenuActionButton contextMenuActionButtonPrimary" type="button" onClick={onSave}>{t('actions.save')}</button>
      </div>
    </div>
  );
}
