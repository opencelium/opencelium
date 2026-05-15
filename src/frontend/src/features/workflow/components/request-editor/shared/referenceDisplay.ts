const REFERENCE_RE =
  /^#?([A-Fa-f0-9]{6})\.\((request|response)\)\.(body|header|status)(?:\.(?:\$\.)?(.*))?$/;

const normalizePath = (path = '') =>
  path.replace(/^\$\./, '').replace(/^\$/, '').trim();

type ParsedReferenceDisplay = {
  messageProperty: 'body' | 'header' | 'status';
  path: string;
};

export const parseReferenceDisplay = (
  reference = '',
): ParsedReferenceDisplay | null => {
  const match = String(reference || '').trim().match(REFERENCE_RE);
  if (!match) return null;

  const [, , , messageProperty, tail = ''] = match;
  return {
    messageProperty: messageProperty as ParsedReferenceDisplay['messageProperty'],
    path: normalizePath(tail),
  };
};

export const getReferenceDisplayLabel = (reference = '') => {
  const parsed = parseReferenceDisplay(reference);
  if (!parsed) return reference;
  if (parsed.messageProperty === 'status') return 'Response Status';
  if (parsed.messageProperty === 'header') return `H:${parsed.path}`;
  return `B:${parsed.path}`;
};

export const getReferenceDisplayTitle = (reference = '') => {
  const parsed = parseReferenceDisplay(reference);
  if (!parsed) return reference;
  if (parsed.messageProperty === 'status') return 'Response Status';
  return `${parsed.messageProperty}.$.${parsed.path}`;
};
