import { getParsedReferences } from '../../bodyReference';

export const getXmlReferenceLabel = (reference: string) => {
  const parsed = getParsedReferences(reference)[0];
  if (!parsed) return reference;
  if (parsed.field === 'status') return 'Response Status';
  if (parsed.field.startsWith('body.')) {
    return `B:${parsed.field.replace(/^body\.\$?\./, '')}`;
  }
  if (parsed.field.startsWith('header.')) {
    return `H:${parsed.field.replace(/^header\.\$?\./, '')}`;
  }
  return parsed.field;
};
