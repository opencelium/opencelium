type JsonReferenceClickData = {
  namespace?: Array<string | number>;
  variable?: { name?: string; value?: unknown };
  name?: string;
  value?: unknown;
};

export const getJsonReferenceField = (data: JsonReferenceClickData) => {
  const namespace = (data.namespace || []).filter(Boolean).map(String);
  const name = String(data.variable?.name || data.name || '');
  const value = data.variable?.value ?? data.value;
  if (!name) return null;
  return {
    namespace,
    name,
    value,
    pathLabel: [...namespace, name].join('.'),
  };
};
