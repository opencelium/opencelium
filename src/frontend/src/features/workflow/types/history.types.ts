export type HistoryVersionItem = {
  id: string;
  snapshotId: string;
  createdAt: number;
  author: string;
  comment: string;
  current?: boolean;
};

export type ConnectionVersionResource = {
  connectionId?: number;
  title?: string;
  snapshotId?: string;
  createdAt?: number | null;
  isCurrent?: boolean;
  current?: boolean;
  author?: number | string | null;
  comment?: string | null;
};
