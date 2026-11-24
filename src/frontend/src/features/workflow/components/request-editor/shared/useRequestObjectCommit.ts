import type { InteractionProps } from 'react-json-view';
import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useGlobalVariablePicker } from '@entities/globalVariable/ui/picker/globalPicker';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { Connection, MethodWithId } from '../../../types/connection';
import { updateConnection, updatePayload } from '../../../store/connection/connectionSlice';
import {
	removeDeletedRequestBindings,
	updateRequestFieldBindings,
} from '../body-editor/bodyBinding';
import { hasLoneScriptReference, isInvalidMixedReferenceInteraction } from './requestFieldRules';

export const useRequestObjectCommit = ({ connection, method, messageProperty }: {
	connection: Connection | null;
	method: MethodWithId;
	messageProperty: 'body' | 'header';
}) => {
	const dispatch = useDispatch();
	const { t } = useI18n('workflow');
	const { items } = useGlobalVariablePicker();
	const scriptNames = useMemo(() => new Set(items.flatMap((item) => (item.kind === 'SCRIPT' ? [item.name] : []))), [items]);
	const [validationError, setValidationError] = useState<string | null>(null);

	const getNextConnection = (
		updatedSource: unknown,
		namespace: string[],
		name: string | undefined,
		newValue: unknown,
	) => {
		if (!connection) return undefined;
		const next = updateRequestFieldBindings(
			connection, method.color, messageProperty,
			{ namespace, name, newValue },
		);
		return removeDeletedRequestBindings(
			next, method.color, messageProperty, updatedSource,
		);
	};

	const commit = (payload: InteractionProps) => {
		if (isInvalidMixedReferenceInteraction(payload)) {
			setValidationError(t('inspector.mixedValueDescription'));
			return false;
		}
		if (hasLoneScriptReference(payload.new_value, scriptNames)) {
			setValidationError(t('inspector.scriptNeedsMethodReference'));
			return false;
		}
		setValidationError(null);
		dispatch(updatePayload({
			methodId: method.id,
			newFields: payload.updated_src,
			messageProperty,
		} as never));
		const namespace = (payload.namespace || []).filter(Boolean).map(String);
		const next = getNextConnection(
			payload.updated_src, namespace, payload.name || undefined, payload.new_value,
		);
		if (next) dispatch(updateConnection({ fieldBindings: next.fieldBindings } as never));
		return true;
	};

	return { commit, validationError, clearValidationError: () => setValidationError(null) };
};
