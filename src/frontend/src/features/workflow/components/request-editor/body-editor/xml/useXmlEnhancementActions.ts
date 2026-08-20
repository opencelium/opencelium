import { useDispatch } from 'react-redux';
import type { Connection, Enhancement, MethodWithId } from '../../../../types/connection';
import { updateConnection } from '../../../../store/connection/connectionSlice';
import { createDirectReferenceEnhancement } from '../bodyBinding';
import { countEnhancementReferences } from '../bodyReference';
import type { XmlSelectionInfo } from './xmlBodyEditor.types';

type Params = {
	connection: Connection | null;
	method: MethodWithId;
	selectionInfo: XmlSelectionInfo | null;
	currentEnhancement?: Enhancement;
	setSelectedEnhanceId: (id?: string) => void;
};

export function useXmlEnhancementActions(params: Params) {
	const dispatch = useDispatch();
	const createEnhancement = () => {
		const { connection, method, selectionInfo } = params;
		if (!connection || !selectionInfo) return;
		const created = createDirectReferenceEnhancement(connection, method.color, 'body',
			selectionInfo.namespace, selectionInfo.name, selectionInfo.value);
		if (!created) return;
		dispatch(updateConnection({ fieldBindings: created.connection.fieldBindings } as never));
		params.setSelectedEnhanceId(created.enhanceId);
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
