import React from 'react';

type FieldsRowProps = {
    children: React.ReactNode;
    align?: 'left' | 'center';
}
const FieldsRow = ({children, align}: FieldsRowProps) => (
    <div style={{display: 'flex', gap: 20, width: '100%'}}>
        {React.Children.map(children, (child) => (
            <div style={{ flex: align === 'center' || !align ? 1 : "none" }}>
                {child}
            </div>
        ))}
    </div>
);

export default FieldsRow;
