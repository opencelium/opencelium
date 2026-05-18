type Props = {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

export function SidebarSearch({ placeholder, value, onChange }: Props) {
  return (
    <input
      className="searchInput"
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
