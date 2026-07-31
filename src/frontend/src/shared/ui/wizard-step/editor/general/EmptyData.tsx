import React, {CSSProperties} from 'react';
import { Empty } from 'antd';
import {FieldContainer} from "@shared/ui/primitives/FieldContainer";


type EmptyDataProps = {
    children?: React.ReactNode
    description?: React.ReactNode
    hasError?: boolean
}

const EmptyData: React.FC<EmptyDataProps> = ({children, description, hasError}: EmptyDataProps) => {
    const styles: CSSProperties | undefined = {width: 'auto'};
    if (hasError) {
        styles.borderColor = 'var(--color-action-danger)';
    }
    return (
        <FieldContainer isEmpty style={styles}>
            <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={description}
            >
                {children}
            </Empty>
        </FieldContainer>
    )
}

export default EmptyData;
