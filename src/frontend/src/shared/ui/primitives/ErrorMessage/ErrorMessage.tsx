import React, {ReactNode} from 'react';

const ErrorMessage = ({message}: {message: string | ReactNode}) => (

    <div style={{
        padding: '10px 14px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--color-status-error-bg)',
        border: '1px solid var(--color-status-error-border)',
        color: 'var(--color-status-error-fg)',
    }}>
        {message}
    </div>
);

export default ErrorMessage;
