import { useEffect, useRef } from 'react';
import type { SidebarSearchProps } from './SidebarSearch.types';

export function SidebarSearch({ placeholder, value, onChange, testId, autoFocus }: SidebarSearchProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (autoFocus) inputRef.current?.focus({ preventScroll: true });
	}, [autoFocus]);

	return (
		<input
			ref={inputRef}
			className='searchInput'
			placeholder={placeholder}
			value={value}
			data-testid={testId}
			onChange={(event) => onChange(event.target.value)}
		/>
	);
}
