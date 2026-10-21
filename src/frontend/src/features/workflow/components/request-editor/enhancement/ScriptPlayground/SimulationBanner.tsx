import { useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Alert } from '@shared/ui/primitives/Alert';

const DISMISSED_KEY = 'opencelium:script-playground:banner-dismissed';

const readDismissed = () => {
	try {
		return localStorage.getItem(DISMISSED_KEY) === '1';
	} catch {
		return false;
	}
};

export function SimulationBanner() {
	const { t } = useI18n('workflow');
	const [isDismissed, setDismissed] = useState(readDismissed);
	if (isDismissed) return null;
	return (
		<Alert
			type="info"
			showIcon
			closable
			message={t('sandbox.banner')}
			onClose={() => {
				setDismissed(true);
				try {
					localStorage.setItem(DISMISSED_KEY, '1');
				} catch {
					// Storage can be blocked; the banner then only stays closed for this session.
				}
			}}
		/>
	);
}
