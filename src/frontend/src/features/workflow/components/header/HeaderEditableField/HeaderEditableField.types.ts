import type { RefObject } from 'react';

export type HeaderEditableFieldProps = {
	className: string;
	value: string;
	onChange: (value: string) => void;
	onSubmit: () => void;
	onCancel: () => void;
	onBlur?: () => void;
	loading?: boolean;
	inputRef: RefObject<HTMLInputElement | null>;
};
