export type SidebarSearchProps = {
	placeholder: string;
	value: string;
	onChange: (value: string) => void;
	testId?: string;
	autoFocus?: boolean;
};
