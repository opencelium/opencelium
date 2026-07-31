export type ParsedLogFile = {
  executionId: string;
  label: string;
};

// Log file names follow the shape
// "{yyyy-mm-dd}_{hh-mm}_{connectionId}_{s|f}_{executionId}.log"
// e.g. "2026-06-03_09-17_1_s_134.log". We turn that into a select option whose
// label reads "#134 - 03.06.2026 09:17" and whose value is the executionId.
export function parseLogFileName(fileName: string): ParsedLogFile | null {
  const base = fileName.replace(/\.log$/i, "");
  const parts = base.split("_");
  if (parts.length < 5) return null;

  const [date, time, , , executionId] = parts;
  const [year, month, day] = date.split("-");
  const [hour, minute] = time.split("-");
  if (!year || !month || !day || !hour || !minute || !executionId) return null;

  return {
    executionId,
    label: `#${executionId} - ${day}.${month}.${year} ${hour}:${minute}`,
  };
}
