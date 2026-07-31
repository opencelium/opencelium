export type TriggerConnectionPanelItem = {
	key: string;
	title: string;
	text: string;
	disabled?: boolean;
};

export type TriggerConnectionPanelProps = {
	isFetching: boolean;
	isError: boolean;
	items: TriggerConnectionPanelItem[];
	onSelect: (key: string) => void;
};
