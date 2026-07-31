// Two ways to label a method row: by request URL or by the method's label/name.
export type MethodViewMode = "url" | "name";

// Resolve what a method row shows for the given mode. In "name" mode it prefers
// the method label and falls back to the name; "url" mode shows the URL. Each
// mode falls back to the other source when its own is empty, so a row is never
// blank (e.g. a live socket line that arrives without a URL yet).
export function methodDisplayText(
  mode: MethodViewMode,
  parts: { url?: string; label?: string; name?: string },
): string {
  const url = parts.url?.trim();
  const label = parts.label?.trim();
  const name = parts.name?.trim();
  if (mode === "name") return label || name || url || "";
  return url || label || name || "";
}
