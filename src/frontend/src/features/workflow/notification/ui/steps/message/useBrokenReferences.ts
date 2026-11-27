import { useMemo } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useJsonPathEnvironment } from '../../../../components/request-editor/body-editor/jsonPathEnvironment';
import { findBrokenReferences, type BrokenReference } from '../../../model/brokenReferences';
import { useNotificationReferences } from '../../references/notificationReferenceContextValue';

/** The step references in the message text that the backend could not resolve. */
export function useBrokenReferences(text: string) {
	const { connection } = useNotificationReferences();
	const environment = useJsonPathEnvironment();
	const stepColors = useMemo(() => new Set(connection.fromConnector.method
		.map((method) => method.color?.toLowerCase()).filter((color): color is string => !!color)), [connection]);
	return useMemo(() => findBrokenReferences(text, stepColors, environment), [text, stepColors, environment]);
}

export function useBrokenReferenceMessage() {
	const { t } = useI18n('workflow');
	return (broken: BrokenReference): string => {
		switch (broken.reason) {
			case 'malformed': return t('notification.message.brokenReference.malformed');
			case 'direction': return t('notification.message.brokenReference.direction', { direction: broken.direction });
			case 'unknownStep': return t('notification.message.brokenReference.unknownStep', { color: broken.color });
			case 'pathSyntax': return broken.character
				? t('notification.message.brokenReference.pathSyntaxAt', { character: broken.character })
				: t('notification.message.brokenReference.pathSyntax');
			default: {
				const _exhaustive: never = broken;
				return _exhaustive;
			}
		}
	};
}
