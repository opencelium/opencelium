// Serialize a log element's identifying info (type + properties + segment) for
// copy. Shared by the stored-logs and live-logs operator copy buttons.
export const serializeLogElement = (el: {
  type: string;
  properties: unknown;
  segment: unknown;
}): string =>
  JSON.stringify({ type: el.type, properties: el.properties, segment: el.segment }, null, 2);
