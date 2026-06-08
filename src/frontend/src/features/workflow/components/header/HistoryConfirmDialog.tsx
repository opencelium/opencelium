import { useI18n } from '@shared/i18n/hooks/useI18n';

type Props = {
  cancelText?: string;
  confirmText?: string;
  confirmVariant?: 'primary' | 'danger';
  message: string;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function HistoryConfirmDialog({
  cancelText,
  confirmText,
  confirmVariant = 'primary',
  message,
  title,
  onCancel,
  onConfirm,
}: Props) {
  const { t } = useI18n('workflow');
  return (
    <div className='historyConfirmOverlay'>
      <div className='historyConfirmDialog'>
        <strong>{title}</strong>
        <span>{message}</span>
        <div className='historyConfirmActions'>
          <button className='iconButton' type='button' onClick={onCancel}>
            {cancelText ?? t('actions.cancel')}
          </button>
          <button className={`primaryButton ${confirmVariant === 'danger' ? 'historyDangerButton' : ''}`} type='button' onClick={onConfirm}>
            {confirmText ?? t('actions.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
