import React from 'react';
import { Tooltip as AntTooltipBase } from 'antd';
import type { TooltipComponent } from './Tooltip.types';
import './tooltip.ant.css';

export const AntTooltip: TooltipComponent = ({
    content,
    placement = 'top',
    children,
}) => {
    return (
        <AntTooltipBase
            title={content}
            placement={placement}
            overlayClassName="ant-tooltip-custom"
        >
            <span style={{justifyContent: 'center', alignItems: 'center', display: 'flex'}}>{children}</span>
        </AntTooltipBase>
    );
};
