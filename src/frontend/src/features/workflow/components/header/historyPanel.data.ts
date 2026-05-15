export type HistoryVersionItem = {
  id: string;
  snapshotId: string;
  createdAt: number;
  author: string;
  comment: string;
  current?: boolean;
};

export const historyItems: HistoryVersionItem[] = [];
