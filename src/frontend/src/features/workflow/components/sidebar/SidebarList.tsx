type SidebarItem = {
  key: string;
  title: string;
  text: string;
};

type Props = {
  items: readonly SidebarItem[];
  onSelect: (key: string) => void;
};

export function SidebarList({ items, onSelect }: Props) {
  return (
    <div className="sidebarList">
      {items.map((item) => (
        <button
          key={item.key}
          className="sidebarItem"
          type="button"
          onClick={() => onSelect(item.key)}
        >
          <strong>{item.title}</strong>
          <span>{item.text}</span>
        </button>
      ))}
    </div>
  );
}
