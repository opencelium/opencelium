import React from "react";
import ReactJson from "react-json-view";
import { useTheme } from "@shared/theme/hooks/useTheme";

type Props = {
  data: object;
  name?: string | false;
  minHeight?: number;
  // When true, drop the bordered/scrolling container so a parent can own
  // sizing (used by the resizable method-detail views).
  bare?: boolean;
};

// react-json-view ships React 17 typings; the project already casts it to a
// permissive component type to use it under React 19 (see LegacyRequestJsonEditor).
const Json = ReactJson as unknown as React.ComponentType<
  Record<string, unknown>
>;

export function LogJsonView({
  data,
  name = false,
  minHeight = 96,
  bare = false,
}: Props) {
  const { themeMode } = useTheme();

  return (
    <div
      style={
        bare
          ? { padding: "8px 12px" }
          : {
              minHeight,
              maxHeight: 220,
              padding: "8px 12px",
              border: "1px solid var(--color-border-default)",
              borderRadius: 6,
              overflow: "auto",
            }
      }
    >
      <Json
        name={name}
        src={data}
        collapsed={false}
        enableClipboard={false}
        displayDataTypes={false}
        displayObjectSize={false}
        theme={themeMode === "dark" ? "twilight" : "rjv-default"}
        style={{
          background: "transparent",
          fontSize: 13,
          wordBreak: "break-word",
        }}
      />
    </div>
  );
}
