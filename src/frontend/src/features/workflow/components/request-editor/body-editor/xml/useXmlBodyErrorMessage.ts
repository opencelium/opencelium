import { useI18n } from '@shared/i18n/hooks/useI18n';
import { XML_MAX_DEPTH, type XmlBodyError } from '../../../../utils/xmlBody';

/** Why an XML text cannot become the body, in the user's language. */
export function useXmlBodyErrorMessage() {
  const { t } = useI18n('workflow');
  return (error: XmlBodyError): string => {
    switch (error.kind) {
      case 'empty':
      case 'invalid':
      case 'multipleRoots':
      case 'mixedContent':
      case 'interleaved':
        return t(`xmlBody.errors.${error.kind}`);
      case 'tooDeep':
        return t('xmlBody.errors.tooDeep', { max: XML_MAX_DEPTH });
      case 'reservedName':
        return t('xmlBody.errors.reservedName', { name: error.name });
      default: {
        const _exhaustive: never = error;
        return _exhaustive;
      }
    }
  };
}
