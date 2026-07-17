import React from 'react';
import {
    CheckOutlined,
    CloseOutlined,
    UserOutlined,
    DeleteOutlined,
    EditOutlined,
    InfoOutlined,
    PlusOutlined,
    SettingOutlined, NotificationOutlined,
    DownloadOutlined,
    UploadOutlined,
    KeyOutlined,
    SwapOutlined,
    FilterOutlined,
    SearchOutlined,
    UnorderedListOutlined,
    LoginOutlined,
    LogoutOutlined,
    HistoryOutlined,
    ArrowLeftOutlined,
    MoreOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    RightOutlined,
    LeftOutlined,
    DownOutlined,
    FullscreenOutlined,
    FullscreenExitOutlined,
    ReloadOutlined,
    BranchesOutlined,
    ThunderboltOutlined,
    GlobalOutlined,
} from '@ant-design/icons';

import type { IconComponent } from './Icon.types';
import {RiListSettingsLine, RiListSettingsFill  } from "react-icons/ri";
import {MdKeyboardCommandKey, MdContentCopy, MdPlayArrow, MdStop, MdUnfoldMore, MdUnfoldLess, MdToggleOn, MdToggleOff} from "react-icons/md";
import {TbWebhook} from "react-icons/tb";
import {BsJournalText} from "react-icons/bs";
import {GoArrowSwitch, GoWorkflow} from "react-icons/go";

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
    upload: UploadOutlined,
    key: KeyOutlined,
    convert: SwapOutlined,
    filter: FilterOutlined,
    search: SearchOutlined,
    list: UnorderedListOutlined,
    login: LoginOutlined,
    logout: LogoutOutlined,
    history: HistoryOutlined,
    'arrow-left': ArrowLeftOutlined,
    more: MoreOutlined,
    expand: MdUnfoldMore,
    collapse: MdUnfoldLess,
    'toggle-on': MdToggleOn,
    'toggle-off': MdToggleOff,
    'journal-text': BsJournalText,
    eye: EyeOutlined,
    'eye-off': EyeInvisibleOutlined,
    'chevron-right': RightOutlined,
    'chevron-left': LeftOutlined,
    'chevron-down': DownOutlined,
    maximize: FullscreenOutlined,
    minimize: FullscreenExitOutlined,
    'arrow-switch': GoArrowSwitch,
    workflow: GoWorkflow,
    refresh: ReloadOutlined,
    connector: BranchesOutlined,
    flash: ThunderboltOutlined,
    'http-request': GlobalOutlined,
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
        inherit: 'currentColor',
    };

    return (
        <Component
            className={className}
            style={{
                fontSize: size,
                color: isSubtle ? 'var(--color-text-secondary)' : colorMap[color],
            }}
            onClick={onClick}
        />
    );
};
