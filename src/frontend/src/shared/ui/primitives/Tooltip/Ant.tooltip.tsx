import { Tooltip as AntTooltipBase } from 'antd';
import type { TooltipComponent } from './Tooltip.types';
import './tooltip.ant.css';

export const AntTooltip: TooltipComponent = ({
    content,
    placement = 'top',
    zIndex,
    maxWidth,
    variant = 'default',
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
            color={variant === 'card' ? 'var(--color-background-elevated)' : undefined}
            classNames={{ root: variant === 'card' ? 'ant-tooltip-custom ant-tooltip-card' : 'ant-tooltip-custom' }}
            styles={(zIndex || maxWidth) ? { root: { ...(zIndex && { zIndex }), ...(maxWidth && { maxWidth }) } } : undefined}
        >
            <span style={{justifyContent: 'center', alignItems: 'center', display: 'flex', minWidth: 0}}>{children}</span>
        </AntTooltipBase>
    );
};
