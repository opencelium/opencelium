import { useSelector } from 'react-redux';
import type { RootState } from '../../../../store';
import { useMethodContext } from '../../../../providers/MethodContext';
import { buildFieldReferences } from './referenceInfo.utils';
import { ReferenceInfoRow } from './ReferenceInfoRow';
import type { ReferenceInfoProps } from './ReferenceInfo.types';
import './ReferenceInfo.css';

export function ReferenceInfo({ messageProperty, data, onReferenceClick }: ReferenceInfoProps) {
	const connection = useSelector((state: RootState) => state.connection.connection);
	const { method: currentMethod } = useMethodContext();
	if (!connection || !currentMethod) return null;

	const references = buildFieldReferences(connection, currentMethod, messageProperty);
	const entries = Object.entries(references);
	const paramKey = String(data?.param?.key || '').trim();

	return (
		<div className='referenceInfo'>
			{entries.map(([field, refs]) => (
				<ReferenceInfoRow key={field || '__empty_field__'} field={field} refs={refs}
					messageProperty={messageProperty} paramKey={paramKey} onClick={onReferenceClick} />
			))}
			{!entries.length && (
				<div className='referenceInfoEmpty'>No references found in {messageProperty}.</div>
			)}
		</div>
	);
}
