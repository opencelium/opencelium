type Props = {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  testId?: string;
};

export function SidebarSearch({ placeholder, value, onChange, testId }: Props) {
  return (
    <input
      className="searchInput"
      placeholder={placeholder}
      value={value}
      data-testid={testId}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
