export type ErrorText = { headline: string; lines: string[]; fullText: string };

// The backend often puts the whole Java stack trace into the message itself, so
// the headline is the message's first line and everything after it joins the
// stack trace lines.
export function splitErrorText(message: string, stackTrace?: string | string[] | null): ErrorText {
  const [headline = "", ...rest] = message.split("\n");
  const stack = Array.isArray(stackTrace) ? stackTrace : (stackTrace ?? "").split("\n");
  const lines = [...rest, ...stack].map((line) => line.trim()).filter(Boolean);
  return { headline: headline.trim(), lines, fullText: [headline.trim(), ...lines].join("\n") };
}
