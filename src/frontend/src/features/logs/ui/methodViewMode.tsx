import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { Switch } from "@shared/ui/primitives/Switch";
import { Tooltip } from "@shared/ui/primitives/Tooltip";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import type { MethodViewMode } from "./methodView";

type MethodViewModeState = {
  mode: MethodViewMode;
  setMode: (mode: MethodViewMode) => void;
};

const MethodViewModeContext = createContext<MethodViewModeState>({
  mode: "url",
  setMode: () => {},
});

// Holds the method-row display mode (URL vs label/name) for one log viewer.
// Mounted around both the tree and the header switcher so the toggle and every
// method row share the same state.
export function MethodViewModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<MethodViewMode>("url");
  const value = useMemo(() => ({ mode, setMode }), [mode]);
  return (
    <MethodViewModeContext.Provider value={value}>
      {children}
    </MethodViewModeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMethodViewMode(): MethodViewModeState {
  return useContext(MethodViewModeContext);
}

// Header toggle between the URL and method-name views, placed next to the
// maximize/download actions.
export function MethodViewSwitcher() {
  const { t } = useI18n("logs");
  const { mode, setMode } = useMethodViewMode();
  return (
    <Tooltip content={t("methodView.tooltip")}>
      <span style={{ display: "inline-flex" }}>
        <Switch
          checked={mode === "name"}
          onChange={(checked) => setMode(checked ? "name" : "url")}
          text={{ on: t("methodView.name"), off: t("methodView.url") }}
        />
      </span>
    </Tooltip>
  );
}
