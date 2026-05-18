import React, {ReactNode} from 'react';

const ErrorMessage = ({message}: {message: string | ReactNode}) => (

    <div style={{
        padding: '10px 14px',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(255,77,79,0.08)',
        border: '1px solid #ff4d4f',
        color: '#ff4d4f',
    }}>
        {message}
    </div>
);

export default ErrorMessage;
