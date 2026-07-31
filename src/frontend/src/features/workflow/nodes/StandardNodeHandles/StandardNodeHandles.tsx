import { Handle, Position } from '@xyflow/react';

export function StandardNodeHandles() {
	return (
		<>
			<Handle id='left' type='target' position={Position.Left} className='handleInvisible' />
			<Handle id='top' type='target' position={Position.Top} className='handleInvisible' />
			<Handle id='right' type='source' position={Position.Right} className='handleInvisible' />
			<Handle id='bottom' type='source' position={Position.Bottom} className='handleInvisible' />
		</>
	);
}
