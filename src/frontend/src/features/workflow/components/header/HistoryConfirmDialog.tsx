type Props = { onCancel: () => void; onDelete: () => void };

export function HistoryConfirmDialog({ onCancel, onDelete }: Props) {
  return (
    <div className='historyConfirmOverlay'>
      <div className='historyConfirmDialog'>
        <strong>Delete version?</strong>
        <span>This action removes the selected version from history.</span>
        <div className='historyConfirmActions'>
          <button className='iconButton' type='button' onClick={onCancel}>
            Cancel
          </button>
          <button className='primaryButton historyDangerButton' type='button' onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
