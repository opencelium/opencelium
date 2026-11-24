import ReferenceGenerator from '../../../components/request-editor/reference-generator/ReferenceGenerator';
import { useNotificationReferences } from './notificationReferenceContextValue';

type Props = {
	pickerId: string;
	onApply: (reference: string) => void;
};

/** The workflow's standard connector → method → field picker, shown inline under the field it fills. */
export function NotificationReferencePicker({ pickerId, onApply }: Props) {
	const { connection, currentMethod, activePickerId, setActivePickerId } = useNotificationReferences();
	if (activePickerId !== pickerId || !currentMethod) return null;
	return (
		<div className='notificationReferencePicker' data-testid={`notification-reference-picker-${pickerId}`}>
			<ReferenceGenerator open connection={connection} currentMethod={currentMethod}
				onClose={() => setActivePickerId(null)}
				onApply={(reference) => {
					onApply(reference);
					setActivePickerId(null);
				}} />
		</div>
	);
}
