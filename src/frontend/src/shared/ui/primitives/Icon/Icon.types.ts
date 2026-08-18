import React from "react";

export type IconName =
    | 'check'
    | 'close'
    | 'user'
    | 'delete'
    | 'edit'
    | 'info'
    | 'plus'
    | 'settings'
    | 'admin-menu'
    | 'main-menu'
    | 'command'
    | 'notification'
    | 'profile'
    | 'content-copy'
    | 'webhook'
    | 'play'
    | 'pause'
    | 'stop'
    | 'step-forward'
    | 'skip-forward'
    | 'download'
    | 'upload'
    | 'key'
    | 'convert'
    | 'filter'
    | 'search'
    | 'list'
    | 'login'
    | 'logout'
    | 'history'
    | 'arrow-left'
    | 'more'
    | 'expand'
    | 'collapse'
    | 'toggle-on'
    | 'toggle-off'
    | 'journal-text'
    | 'eye'
    | 'eye-off'
    | 'chevron-right'
    | 'chevron-left'
    | 'chevron-down'
    | 'maximize'
    | 'minimize'
    | 'arrow-switch'
    | 'workflow'
    | 'refresh'
    | 'connector'
    | 'flash'
    | 'http-request'
    | 'aggregator'
    | 'lock'
    | 'help'
    | 'report-analytics'
    | 'docs'
    | 'undo'
    | 'redo'

export type IconColor =
    | 'default'
    | 'primary'
    | 'secondary'
    | 'danger'
    | 'inherit';

export interface IconProps {
    name: IconName;
    size?: number;
    color?: IconColor;
    className?: string;
    onClick?: () => void,
    isSubtle?: boolean,
}

export type IconComponent = React.FC<IconProps>;
