import React from 'react';
import { Empty } from 'antd';
import type { EmptyComponent } from '../Empty.types';

export const AntEmpty: EmptyComponent = ({ description, image, children, className, style }) => {
    return (
        <Empty
            className={className}
            style={style}
            description={description}
            image={image ?? undefined}
        >
            {children}
        </Empty>
    );
};
