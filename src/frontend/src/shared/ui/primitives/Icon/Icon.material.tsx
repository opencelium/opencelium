import React from 'react';
import {
    Check,
    Close,
    Person,
    Delete,
    Edit,
    Info,
    PlusOne,
    Settings,
    Download,
    SwapHoriz,
    FilterAlt,
    PlayArrow,
    Stop,
    Search,
    List as ListIcon,
    Login,
    History,
    ArrowBack,
    MoreVert,
} from '@mui/icons-material';

import type { IconComponent } from './Icon.types';

const iconMap = {
    check: Check,
    close: Close,
    user: Person,
    delete: Delete,
    edit: Edit,
    info: Info,
    plus: PlusOne,
    settings: Settings,
    play: PlayArrow,
    stop: Stop,
    download: Download,
    convert: SwapHoriz,
    filter: FilterAlt,
    search: Search,
    list: ListIcon,
    login: Login,
    history: History,
    'arrow-left': ArrowBack,
    more: MoreVert,
};

export const MaterialIcon: IconComponent = ({
    name,
    size = 20,
    color = 'default',
    className,
    onClick,
}) => {
    const Component = iconMap[name];

    const colorMap = {
        default: 'var(--color-text-primary)',
        primary: 'var(--color-action-primary)',
        secondary: 'var(--color-action-secondary)',
        danger: 'var(--color-action-danger)',
    };

    return (
        <Component
            className={className}
            sx={{
                fontSize: size,
                color: colorMap[color],
            }}
            onClick={onClick}
        />
    );
};
