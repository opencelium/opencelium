import React from 'react';
import { Empty } from 'antd';
import type { EmptyComponent } from '../Empty.types';

export const AntEmpty: EmptyComponent = ({ description, image, children, className, style }) => {
    return (
        <Empty
            className={className}
            style={style}
            description={description}
            // antd's own Empty does `image ?? contextImage ?? defaultEmptyImg` internally, so an
            // explicit `null` here would still fall through to its default icon — substitute an
            // empty fragment (a non-nullish node antd renders as-is) to actually suppress it.
            image={image === null ? <></> : image}
            // The image slot otherwise keeps antd's fixed reserved height even with nothing in it.
            styles={image === null ? { image: { height: 0, marginBottom: 0 } } : undefined}
        >
            {children}
        </Empty>
    );
};
