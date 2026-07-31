import React from 'react';
import {IconButton} from "@shared/ui/primitives/IconButton";

type FieldsContainerProps = {
    children: React.ReactNode;
    onDelete?: () => void
}
const FieldsContainer = ({children, onDelete}: FieldsContainerProps) => (
    <div style={{
        display: 'grid',
        gap: 10,
        padding: '20px 10px 10px',
        position: 'relative',
    }}>
        {children}

        {onDelete && <div style={{position: 'absolute', right: 5, top: 5}}>
            <IconButton
                size="sm"
                variant="ghost"
                iconProps={{name: 'delete'}}
                onClick={onDelete}
            />
        </div>}
    </div>
);

export default FieldsContainer;
