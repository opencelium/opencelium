import type { FieldReference } from './ReferenceInfo.types';
import { formatSourceField, formatTargetField } from './referenceInfo.utils';

type Props = {
	field: string;
	refs: FieldReference[];
	messageProperty: string;
	paramKey: string;
	onClick?: (enhanceId: string) => void;
};

export function ReferenceInfoRow({ field, refs, messageProperty, paramKey, onClick }: Props) {
	if (!refs.length) return null;
	const enhanceId = refs[0].enhanceId;
	return (
		<div className='referenceInfoRow' onClick={() => enhanceId && onClick?.(enhanceId)}>
			<div className='referenceInfoTitle'>
				<span className='referenceInfoTarget'>
					{formatTargetField(messageProperty, field, paramKey)}
				</span>{' '}
				has {refs.length > 1 ? 'next references:' : 'one reference:'}
			</div>
			<div className='referenceInfoBindings'>
				{refs.map((reference, index) => (
					<div key={`${reference.enhanceId}-${index}`} className='referenceInfoBinding'>
						<span className='referenceInfoMethod'
							style={{ backgroundColor: reference.method?.color || reference.color }}>
							{reference.method?.name || 'UnknownMethod'}
						</span>
						<span> bound with </span>
						<span className='referenceInfoSource' style={{ color: reference.color }}>
							{formatSourceField(reference.sourceMessageProperty, reference.target)}
						</span>
						<span>{index === refs.length - 1 ? ' field.' : ' field; '}</span>
					</div>
				))}
			</div>
		</div>
	);
}
