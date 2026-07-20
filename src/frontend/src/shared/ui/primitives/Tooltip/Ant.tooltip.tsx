import { Tooltip as AntTooltipBase } from 'antd';
import type { TooltipComponent } from './Tooltip.types';
import './tooltip.ant.css';

export const AntTooltip: TooltipComponent = ({
    content,
    placement = 'top',
    zIndex,
    children,
}) => {
    return (
        <AntTooltipBase
            title={content}
            placement={placement}
            classNames={{ root: 'ant-tooltip-custom' }}
            styles={zIndex ? { root: { zIndex } } : undefined}
        >
            <span style={{justifyContent: 'center', alignItems: 'center', display: 'flex', minWidth: 0}}>{children}</span>
        </AntTooltipBase>
    );
};
