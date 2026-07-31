import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ViewState = {
  // Resized heights of the JSON views, keyed by region.
  heights: Record<string, number>;
  setHeight: (key: string, height: number) => void;
  // Active tab (header/body) of each tab group, keyed by group.
  tabs: Record<string, string>;
  setTab: (key: string, tab: string) => void;
};

const FALLBACK: ViewState = {
  heights: {},
  setHeight: () => {},
  tabs: {},
  setTab: () => {},
};

const MethodDetailViewStateContext = createContext<ViewState>(FALLBACK);

// Holds the method-detail view preferences (JSON view heights and the open
// header/body tab). Mounted at the dialog level so these survive method rows
// remounting while paging through loop iterations.
export function MethodDetailViewStateProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [heights, setHeights] = useState<Record<string, number>>({});
  const [tabs, setTabs] = useState<Record<string, string>>({});

  const setHeight = useCallback((key: string, height: number) => {
    setHeights((prev) =>
      prev[key] === height ? prev : { ...prev, [key]: height },
    );
  }, []);

  const setTab = useCallback((key: string, tab: string) => {
    setTabs((prev) => (prev[key] === tab ? prev : { ...prev, [key]: tab }));
  }, []);

  const value = useMemo(
    () => ({ heights, setHeight, tabs, setTab }),
    [heights, setHeight, tabs, setTab],
  );

  return (
    <MethodDetailViewStateContext.Provider value={value}>
      {children}
    </MethodDetailViewStateContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMethodDetailViewState(): ViewState {
  return useContext(MethodDetailViewStateContext);
}
