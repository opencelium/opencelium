export type SecondarySidebarMode = 'connector' | 'operator';

export const getSecondarySidebarCopy = (
  mode: SecondarySidebarMode,
) => {
  if (mode === 'operator') {
    return ['Choose operator type', 'Select an operator', 'search operator'] as const;
  }

  return ['Choose connector', 'Select a connector first', 'search connector'] as const;
};

export const getMethodSidebarCopy = (connectorTitle?: string) =>
  ['Choose method', `Select a method for ${connectorTitle ?? 'Connector'}`, 'search method'] as const;
