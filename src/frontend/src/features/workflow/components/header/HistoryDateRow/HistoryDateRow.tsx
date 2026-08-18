type Props = { label: string };

export function HistoryDateRow({ label }: Props) {
  return (
    <div className='historyDateRow'>
      <div className='historyDateSpacer' />
      <div className='historyDateInner'>
        <div className='historyDateHr' />
        <div className='historyDateLabel'>{label}</div>
        <div className='historyDateHr' />
      </div>
    </div>
  );
}
