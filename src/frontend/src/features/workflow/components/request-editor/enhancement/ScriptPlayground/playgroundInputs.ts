export type InputMode = "json" | "text" | "missing";
export type InputValue = { mode: InputMode; text: string };
export type InputValues = Record<string, InputValue>;
const key = (id: string) => `opencelium:script-playground:${id}`;

export function readInputs(id: string): InputValues {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key(id)) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
    const result: InputValues = {};
    Object.entries(parsed).forEach(([name, entry]: [string, unknown]) => {
      if (!/^VAR_\d+$/.test(name) || !entry || typeof entry !== "object")
        return;
      const value = entry as Record<string, unknown>;
      if (
        ["json", "text", "missing"].includes(String(value.mode)) &&
        typeof value.text === "string"
      ) {
        result[name] = { mode: value.mode as InputMode, text: value.text };
      }
    });
    return result;
  } catch {
    return {};
  }
}
export function saveInputs(id: string, values: InputValues) {
  try {
    localStorage.setItem(key(id), JSON.stringify(values));
  } catch {
    /* Storage may be disabled. */
  }
}
export function parseInput(input: InputValue): unknown {
  switch (input.mode) {
    case "missing":
      return "";
    case "text":
      return input.text;
    case "json":
      return JSON.parse(input.text);
  }
}
export const emptyInput: InputValue = { mode: "json", text: "" };
