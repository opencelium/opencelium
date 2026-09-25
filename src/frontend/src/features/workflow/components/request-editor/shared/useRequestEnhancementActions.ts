import { useDispatch } from 'react-redux';
import type { Connection, Enhancement, MethodWithId } from '../../../types/connection';
import { updateConnection } from '../../../store/connection/connectionSlice';
import { createDirectReferenceEnhancement } from '../body-editor/bodyBinding';
import { countEnhancementReferences } from '../body-editor/bodyReference';
import type { BodySelection } from '../body-editor/bodyValue';
import type { RequestMessageProperty } from './requestObjectEditor.types';

type Params = {
	connection: Connection | null;
	method: MethodWithId;
	messageProperty: RequestMessageProperty;
	selection: BodySelection | null;
	currentValue: unknown;
	currentEnhancement?: Enhancement;
};

export function useRequestEnhancementActions(params: Params) {
	const dispatch = useDispatch();
	const createEnhancement = () => {
		const { connection, selection, method, messageProperty, currentValue } = params;
		if (!connection || !selection) return;
		const created = createDirectReferenceEnhancement(connection, method.color,
			messageProperty, selection.namespace, selection.name, currentValue);
		if (created) dispatch(updateConnection({ fieldBindings: created.connection.fieldBindings } as never));
	};
	const deleteEnhancement = () => {
		const { connection, currentEnhancement } = params;
		if (!connection || !currentEnhancement
			|| countEnhancementReferences(currentEnhancement) > 1) return;
		dispatch(updateConnection({ fieldBindings: connection.fieldBindings.filter(
			(binding) => binding.enhancement.enhanceId !== currentEnhancement.enhanceId) } as never));
	};
	return { createEnhancement, deleteEnhancement };
}
