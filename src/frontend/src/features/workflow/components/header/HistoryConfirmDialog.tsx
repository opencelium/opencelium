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
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  confirmVariant = 'primary',
  message,
  title,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <div className='historyConfirmOverlay'>
      <div className='historyConfirmDialog'>
        <strong>{title}</strong>
        <span>{message}</span>
        <div className='historyConfirmActions'>
          <button className='iconButton' type='button' onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`primaryButton ${confirmVariant === 'danger' ? 'historyDangerButton' : ''}`} type='button' onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
