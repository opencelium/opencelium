import React from 'react';
import { Typography } from 'antd';
import type { TypographyComponent } from './Typography.types';
import type {BaseType} from "antd/es/typography/Base";

const { Text: AntText, Title } = Typography;

export const AntTypography: TypographyComponent = ({
    children,
    variant = 'body',
    as,
    isBold,
    isUppercase,
    isSubtle,
    isDanger,
}) => {
    if (variant === 'section-label'){
        isSubtle = true;
    }
    let type: BaseType;
    const style: React.CSSProperties = {
        fontWeight: isBold ? '500' : 'normal',
        margin: 0,
        textTransform: isUppercase ? 'uppercase' : 'none',
    };
    if (isSubtle) {
        type = 'secondary';
    }
    if (isDanger) {
        type = 'danger';
    }
    if (as) {
        const Tag = as as React.ElementType;
        return <Tag style={style}>{children}</Tag>;
    }
    switch (variant) {
        case 'headline':
            return <Title type={type} style={style} level={1}>{children}</Title>
        case 'body':
            return <AntText type={type} style={style}>{children}</AntText>
        case 'title':
            return <Title type={type} style={style} level={4}>{children}</Title>;
        case 'label':
            return <Title type={type} style={style} level={5}>{children}</Title>;
        case 'section-label':
            return <AntText type={type} style={style}>{children}</AntText>;
    }

    return <AntText type={type} style={style}>{children}</AntText>;
};
