import { buildTestId } from '@shared/testing/testId';
import { ConnectorStatusDot, type ConnectorStatus } from '../../connector-status/ConnectorStatusDot';

type SidebarItem = {
  key: string;
  title: string;
  text: string;
  imageUrl?: string | null;
  status?: ConnectorStatus;
  // Only set when status === 'failed' — the connector's persisted lastTestError.
  statusError?: string | null;
};

type Props = {
  items: readonly SidebarItem[];
  onSelect: (key: string) => void;
  testIdPrefix?: string;
};

export function SidebarList({ items, onSelect, testIdPrefix }: Props) {
  return (
    <div className="sidebarList">
      {items.map((item) => (
        <button
          key={item.key}
          className={`sidebarItem${item.imageUrl ? ' sidebarItemWithImage' : ''}`}
          type="button"
          data-testid={buildTestId(testIdPrefix, 'item', item.key)}
          onClick={() => onSelect(item.key)}
        >
          <strong>{item.title}</strong>
          <span>{item.text}</span>
          {item.statusError ? (
            <span className="sidebarItemError">{item.statusError}</span>
          ) : null}
          {item.status ? (
            <div className="sidebarItemStatus">
              <ConnectorStatusDot
                status={item.status}
                testId={buildTestId(testIdPrefix, 'status', item.key)}
              />
            </div>
          ) : null}
          {item.imageUrl ? (
            <div className="sidebarItemImage" aria-hidden="true">
              <img src={item.imageUrl} alt="" />
            </div>
          ) : null}
        </button>
      ))}
    </div>
  );
}
