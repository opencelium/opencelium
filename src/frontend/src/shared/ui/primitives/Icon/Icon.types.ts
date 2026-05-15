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
    | 'stop'
    | 'download'
    | 'convert'
    | 'filter'
    | 'search'
    | 'list'
    | 'login'
    | 'logout'
    | 'history'
    | 'arrow-left'
    | 'more'

export type IconColor =
    | 'default'
    | 'primary'
    | 'secondary'
    | 'danger';

export interface IconProps {
    name: IconName;
    size?: number;
    color?: IconColor;
    className?: string;
    onClick?: () => void,
    isSubtle?: boolean,
}

export type IconComponent = React.FC<IconProps>;
