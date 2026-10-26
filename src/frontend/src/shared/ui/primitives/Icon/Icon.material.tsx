import React from 'react';
import {
    Check,
    Close,
    Person,
    Groups,
    Delete,
    Edit,
    Info,
    PlusOne,
    Settings,
    Download,
    Upload,
    Key,
    SwapHoriz,
    FilterAlt,
    PlayArrow,
    Pause,
    Stop,
    SkipNext,
    FastForward,
    Search,
    List as ListIcon,
    Login,
    Logout,
    History,
    ArrowBack,
    MoreVert,
    UnfoldMore,
    UnfoldLess,
    ToggleOn,
    ToggleOff,
    Description,
    Visibility,
    VisibilityOff,
    ChevronRight,
    ChevronLeft,
    ExpandMore,
    Fullscreen,
    FullscreenExit,
    ContentCopy,
    AccountTree,
    Hub,
    Refresh,
    AltRoute,
    Webhook,
    Link,
    LinkOff,
    Bolt,
    Public,
    Merge,
    Lock,
    HelpOutline,
    Analytics,
    MenuBook,
    StickyNote2,
    Undo,
    Redo,
    CallSplit,
    Loop,
    RadioButtonUnchecked,
    GitHub,
    Apps,
} from '@mui/icons-material';

import MouseOutlined from '@mui/icons-material/MouseOutlined';
import DragIndicator from '@mui/icons-material/DragIndicator';
import Remove from '@mui/icons-material/Remove';
import ExpandLess from '@mui/icons-material/ExpandLess';
import FitScreen from '@mui/icons-material/FitScreen';
import Science from '@mui/icons-material/Science';
import WarningAmber from '@mui/icons-material/WarningAmber';
import HighlightOff from '@mui/icons-material/HighlightOff';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import PowerOffOutlined from '@mui/icons-material/PowerOffOutlined';
import ArrowForward from '@mui/icons-material/ArrowForward';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import AccessTime from '@mui/icons-material/AccessTime';
import Code from '@mui/icons-material/Code';
import CloudOutlined from '@mui/icons-material/CloudOutlined';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import OpenInNew from '@mui/icons-material/OpenInNew';
import SendOutlined from '@mui/icons-material/SendOutlined';
import ImageOutlined from '@mui/icons-material/ImageOutlined';
import type { IconComponent } from './Icon.types';

const iconMap = {
    check: Check,
    close: Close,
    user: Person,
    team: Groups,
    delete: Delete,
    edit: Edit,
    info: Info,
    plus: PlusOne,
    settings: Settings,
    play: PlayArrow,
    pause: Pause,
    stop: Stop,
    'step-forward': SkipNext,
    'skip-forward': FastForward,
    mouse: MouseOutlined,
    download: Download,
    upload: Upload,
    key: Key,
    convert: SwapHoriz,
    filter: FilterAlt,
    search: Search,
    list: ListIcon,
    login: Login,
    logout: Logout,
    history: History,
    'arrow-left': ArrowBack,
    more: MoreVert,
    expand: UnfoldMore,
    collapse: UnfoldLess,
    'toggle-on': ToggleOn,
    'toggle-off': ToggleOff,
    'journal-text': Description,
    eye: Visibility,
    'eye-off': VisibilityOff,
    'chevron-right': ChevronRight,
    'chevron-left': ChevronLeft,
    'chevron-down': ExpandMore,
    maximize: Fullscreen,
    minimize: FullscreenExit,
    'arrow-switch': SwapHoriz,
    'content-copy': ContentCopy,
    workflow: AccountTree,
    bindings: Hub,
    refresh: Refresh,
    connector: AltRoute,
    webhook: Webhook,
    link: Link,
    unlink: LinkOff,
    flash: Bolt,
    'http-request': Public,
    aggregator: Merge,
    lock: Lock,
    help: HelpOutline,
    'report-analytics': Analytics,
    docs: MenuBook,
    comment: StickyNote2,
    undo: Undo,
    redo: Redo,
    if: CallSplit,
    loop: Loop,
    circle: RadioButtonUnchecked,
    git: GitHub,
    globe: Public,
    portal: Apps,
    'drag-handle': DragIndicator,
    minus: Remove,
    'chevron-up': ExpandLess,
    'fit-view': FitScreen,
    flask: Science,
    warning: WarningAmber,
    'error-circle': HighlightOff,
    'check-circle': CheckCircleOutline,
    clock: AccessTime,
    code: Code,
    cloud: CloudOutlined,
    package: Inventory2Outlined,
    'external-link': OpenInNew,
    send: SendOutlined,
    image: ImageOutlined,
    sparkles: AutoAwesomeOutlined,
    'plug-off': PowerOffOutlined,
    'arrow-right': ArrowForward,
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
        inherit: 'currentColor',
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
