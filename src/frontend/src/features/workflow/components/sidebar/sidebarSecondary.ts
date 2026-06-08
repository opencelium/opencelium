export type SecondarySidebarMode = 'connector' | 'operator';

type TFn = (key: string, values?: Record<string, unknown>) => string;

export const getSecondarySidebarCopy = (
  mode: SecondarySidebarMode,
  t: TFn,
) => {
  if (mode === 'operator') {
    return [
      t('sidebar.operatorStep.header'),
      t('sidebar.operatorStep.subtitle'),
      t('sidebar.operatorStep.searchPlaceholder'),
    ] as const;
  }

  return [
    t('sidebar.connectorStep.header'),
    t('sidebar.connectorStep.subtitle'),
    t('sidebar.connectorStep.searchPlaceholder'),
  ] as const;
};

export const getMethodSidebarCopy = (t: TFn, connectorTitle?: string) =>
  [
    t('sidebar.methodStep.header'),
    t('sidebar.methodStep.subtitle', {
      connector: connectorTitle ?? t('sidebar.methodStep.connectorFallback'),
    }),
    t('sidebar.methodStep.searchPlaceholder'),
  ] as const;
