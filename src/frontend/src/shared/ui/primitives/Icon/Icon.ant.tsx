import React from 'react';
import {
    CheckOutlined,
    CloseOutlined,
    UserOutlined,
    DeleteOutlined,
    DeleteFilled,
    EditOutlined,
    InfoOutlined,
    PlusOutlined,
    SettingOutlined, NotificationOutlined,
    DownloadOutlined,
    SwapOutlined,
    FilterOutlined,
    SearchOutlined,
    UnorderedListOutlined,
    LoginOutlined,
    LogoutOutlined,
    HistoryOutlined,
    ArrowLeftOutlined,
    MoreOutlined,
} from '@ant-design/icons';

import type { IconComponent } from './Icon.types';
import {RiListSettingsLine, RiListSettingsFill  } from "react-icons/ri";
import {MdKeyboardCommandKey, MdContentCopy, MdPlayArrow, MdStop} from "react-icons/md";
import {TbWebhook} from "react-icons/tb";
import {Component} from "lucide-react";

const iconMap = {
    check: CheckOutlined,
    close: CloseOutlined,
    user: UserOutlined,
    delete: DeleteOutlined,
    edit: EditOutlined,
    info: InfoOutlined,
    plus: PlusOutlined,
    settings: SettingOutlined,
    'admin-menu': RiListSettingsLine,
    'main-menu': RiListSettingsFill,
    command: MdKeyboardCommandKey,
    notification: NotificationOutlined,
    profile: UserOutlined,
    'content-copy': MdContentCopy,
    webhook: TbWebhook,
    play: MdPlayArrow,
    stop: MdStop,
    download: DownloadOutlined,
    convert: SwapOutlined,
    filter: FilterOutlined,
    search: SearchOutlined,
    list: UnorderedListOutlined,
    login: LoginOutlined,
    logout: LogoutOutlined,
    history: HistoryOutlined,
    'arrow-left': ArrowLeftOutlined,
    more: MoreOutlined,
};

export const AntIcon: IconComponent = ({
    name,
    size = 20,
    color = 'default',
    className,
    onClick,
    isSubtle,
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
            style={{
                fontSize: size,
                color: isSubtle ? 'rgb(102, 102, 102)' : colorMap[color],
            }}
            onClick={onClick}
        />
    );
};
