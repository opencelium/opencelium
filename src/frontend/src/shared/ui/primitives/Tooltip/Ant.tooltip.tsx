import { Tooltip as AntTooltipBase } from 'antd';
import type { TooltipComponent } from './Tooltip.types';
import './tooltip.ant.css';

export const AntTooltip: TooltipComponent = ({
    content,
    placement = 'top',
    zIndex,
    maxWidth,
    open,
    onOpenChange,
    children,
}) => {
    return (
        <AntTooltipBase
            title={content}
            placement={placement}
            open={open}
            onOpenChange={onOpenChange}
            classNames={{ root: 'ant-tooltip-custom' }}
            styles={(zIndex || maxWidth) ? { root: { ...(zIndex && { zIndex }), ...(maxWidth && { maxWidth }) } } : undefined}
        >
            <span style={{justifyContent: 'center', alignItems: 'center', display: 'flex', minWidth: 0}}>{children}</span>
        </AntTooltipBase>
    );
};
