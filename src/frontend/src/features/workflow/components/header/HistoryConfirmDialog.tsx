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
      <div className='historyConfirmDialog' data-testid='workflow-history-confirm'>
        <strong>{title}</strong>
        <span>{message}</span>
        <div className='historyConfirmActions'>
          <button className='iconButton' type='button' data-testid='workflow-history-confirm-cancel' onClick={onCancel}>
            {cancelText ?? t('actions.cancel')}
          </button>
          <button className={`primaryButton ${confirmVariant === 'danger' ? 'historyDangerButton' : ''}`} type='button' data-testid='workflow-history-confirm-ok' onClick={onConfirm}>
            {confirmText ?? t('actions.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
