import { RightOutlined, DownOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useMethodContext } from '../../../providers/MethodContext';
import type { RootState } from '../../../store';
import { ReferenceInfo } from '../reference-info/ReferenceInfo';
import './bodyLegacy.css';

type Props = { onReferenceClick?: (enhanceId: string) => void };

type ExtendedProps = Props & { messageProperty?: 'body' | 'header' };

export function LegacyReferenceInfoSection({ onReferenceClick, messageProperty = 'body' }: ExtendedProps) {
  const [open, setOpen] = useState(false);
  const connection = useSelector((state: RootState) => state.connection.connection);
  const { method } = useMethodContext();
  const hasRefs = !!connection?.fieldBindings.some((binding) => {
    const result = binding.enhancement?.args?.RESULT_VAR;
    return typeof result === 'string' && result.startsWith(`${method.color}.(request).${messageProperty}.$`);
  });

  return (
    <div>
      <div className='bodyLegacyInfoHeader'>
        <b>Reference information</b>
        {hasRefs ? (
          <Button type='text' size='small' icon={open ? <DownOutlined /> : <RightOutlined />} onClick={() => setOpen((value) => !value)} />
        ) : (
          <span className='bodyLegacyInfoEmpty'>(is empty now)</span>
        )}
      </div>
      {open && hasRefs ? <ReferenceInfo messageProperty={messageProperty} data={{}} onReferenceClick={onReferenceClick} /> : null}
    </div>
  );
}
