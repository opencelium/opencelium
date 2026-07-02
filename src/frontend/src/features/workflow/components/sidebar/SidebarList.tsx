import { buildTestId } from '@shared/testing/testId';

type SidebarItem = {
  key: string;
  title: string;
  text: string;
  imageUrl?: string | null;
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
