import React from 'react';
import { Card } from 'antd';
import type { CardComponent } from './Card.types';
import './card.ant.css';

export const AntCard: CardComponent = ({
    id,
    title,
    extra,
    footer,
    bordered = true,
    elevated = true,
    className = '',
    style,
    children,
}) => {
    return (
        <Card
            id={id}
            style={style}
            rootClassName={className}
            title={title}
            extra={extra}
            variant={bordered ? 'outlined' : 'borderless'}
            className={elevated ? 'ant-card-elevated' : ''}
        >
            {children}

            {footer && (
                <div className="ant-card-footer">
                    {footer}
                </div>
            )}
        </Card>
    );
};
