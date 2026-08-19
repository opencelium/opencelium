export type LoopExample = {
  methodLabel?: string;
  connectorIcon?: string | null;
  hasMethod: boolean;
  responseType: 'body' | 'header' | 'status';
};

export type LoopTour = {
  description: string;
  args: { code: string; text: string }[];
  examples: { code: string; result: string }[];
};

export type LoopInfoPanelProps = {
  iterator?: string;
  operator?: string;
  example?: LoopExample;
};
