import { createContext, useContext, type ReactNode } from "react";

/** Resolves the label a method was given, from its structural indexPath. */
export type MethodLabelResolver = (indexPath: string) => string | undefined;

const NO_LABELS: MethodLabelResolver = () => undefined;

const MethodLabelContext = createContext<MethodLabelResolver>(NO_LABELS);

// An execution log only ever names a method by its operation `name` — the
// backend's log schema (resources/logger/log-schema.json) has no label property,
// so `properties.label` never arrives populated. A viewer that also has the
// workflow in hand (the editor's test-run panel) can supply the labels its user
// gave those steps; one that doesn't (the schedule list's stored-log dialog)
// mounts no provider and keeps showing names.
//
// Keyed by indexPath because that is the only method identity the log and the
// graph share — the same tree path the payload's method indexes are built from.
export function MethodLabelProvider({
  resolve,
  children,
}: {
  resolve: MethodLabelResolver;
  children: ReactNode;
}) {
  return (
    <MethodLabelContext.Provider value={resolve}>
      {children}
    </MethodLabelContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMethodLabelResolver(): MethodLabelResolver {
  return useContext(MethodLabelContext);
}
