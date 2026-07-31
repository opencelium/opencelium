import type { HistoryVersionItem } from './historyPanel.data';

type HistoryRow =
	| { kind: 'date'; key: string; label: string }
	| { kind: 'item'; key: string; item: HistoryVersionItem };

const pad = (value: number) => String(value).padStart(2, '0');

export const formatTime = (timestamp: number) => {
	const date = new Date(timestamp);
	return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatDate = (timestamp: number) => {
	const date = new Date(timestamp);
	return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
};

export const buildHistoryRows = (items: HistoryVersionItem[]): HistoryRow[] => {
	let lastDate = '';

	return items.flatMap((item) => {
		const nextDate = formatDate(item.createdAt);
		const rows: HistoryRow[] = [];

		if (nextDate !== lastDate) {
			rows.push({ kind: 'date', key: `date-${nextDate}`, label: nextDate });
			lastDate = nextDate;
		}

		rows.push({ kind: 'item', key: item.id, item });
		return rows;
	});
};
