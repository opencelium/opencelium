import { useMemo } from 'react';
import { Alert } from '@shared/ui/primitives/Alert';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { findXmlBackendLimits } from '../../../../../utils/xmlBackendLimits';

const MAX_LISTED = 5;

/** Says which parts of an XML body the backend will not send as shown, until it supports them. */
export function XmlBackendLimitsWarning({ body }: { body: unknown }) {
	const { t } = useI18n('workflow');
	const limits = useMemo(() => findXmlBackendLimits(body), [body]);
	if (!limits.attributes.length && !limits.prefixes.length) return null;
	const list = (names: string[]) => names.length > MAX_LISTED
		? `${names.slice(0, MAX_LISTED).join(', ')}, …` : names.join(', ');
	return (
		<div data-testid='xml-backend-limits'>
			<Alert type='warning' showIcon message={t('xmlBody.limits.title')} description={
				<>
					{limits.attributes.length > 0 && <div>{t('xmlBody.limits.attributes', { elements: list(limits.attributes) })}</div>}
					{limits.prefixes.length > 0 && <div>{t('xmlBody.limits.prefixes', { elements: list(limits.prefixes) })}</div>}
				</>
			} />
		</div>
	);
}
