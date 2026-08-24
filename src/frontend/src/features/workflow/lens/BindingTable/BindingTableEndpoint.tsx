import { MethodColorDot } from '../../components/MethodColorDot/MethodColorDot';
import type { LensEndpoint } from '../bindingLens.types';

type Props = {
	endpoint: LensEndpoint;
	/** Shown in place of a method name a reference names but the graph cannot find. */
	unknownLabel: string;
	/** Why this end cannot be read, when it cannot — stated here rather than in a
	 *  column of its own, next to the path it invalidates. */
	reason?: string;
};

/**
 * One end of a binding: the method over the field path inside it. The reference
 * colour is a swatch rather than the name's own colour — the palette holds tones
 * close to either surface, so colouring the text is how a method name goes
 * invisible; the swatch carries the identity and the name stays legible.
 */
export function BindingTableEndpoint({ endpoint, unknownLabel, reason }: Props) {
	return (
		<div className='bindingTableEndpoint'>
			<span className='bindingTableMethod'>
				<MethodColorDot color={endpoint.color} size={10} />
				<span className={`bindingTableMethodName ${endpoint.label ? '' : 'bindingTableMethodUnknown'}`}>
					{endpoint.label ?? unknownLabel}
				</span>
			</span>
			<span className={`bindingTablePath ${reason ? 'bindingTablePathBroken' : ''}`}>
				{endpoint.path}
			</span>
			{reason && <span className='bindingTableReason'>{reason}</span>}
		</div>
	);
}
