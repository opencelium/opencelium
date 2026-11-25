import { LegacyBodyReferenceGenerator } from '../../../components/request-editor/body-editor/LegacyBodyReferenceGenerator/LegacyBodyReferenceGenerator';
import { toReferenceToken } from '../../model/notificationBody';
import { useNotificationReferences } from './notificationReferenceContextValue';

type Props = {
	pickerId: string;
	/** Receives a complete token: `{%#color.(response)…%}`, `${param}` or `{{global.name}}`. */
	onApply: (token: string) => void;
};

/**
 * The same picker as the request URL field — step response, webhook parameter or global
 * variable — shown inline under the field it fills.
 */
export function NotificationReferencePicker({ pickerId, onApply }: Props) {
	const { connection, currentMethod, activePickerId, setActivePickerId } = useNotificationReferences();
	if (activePickerId !== pickerId || !currentMethod) return null;
	return (
		<div className='notificationReferencePicker' data-testid={`notification-reference-picker-${pickerId}`}>
			<LegacyBodyReferenceGenerator connection={connection} currentMethod={currentMethod} autoFocus
				onApply={(picked) => {
					onApply(toReferenceToken(picked));
					setActivePickerId(null);
				}} />
		</div>
	);
}
