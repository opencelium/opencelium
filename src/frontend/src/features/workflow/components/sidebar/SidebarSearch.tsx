import { useEffect, useRef } from 'react';

type Props = {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  testId?: string;
  autoFocus?: boolean;
};

export function SidebarSearch({ placeholder, value, onChange, testId, autoFocus }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  return (
    <input
      ref={inputRef}
      className="searchInput"
      placeholder={placeholder}
      value={value}
      data-testid={testId}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
