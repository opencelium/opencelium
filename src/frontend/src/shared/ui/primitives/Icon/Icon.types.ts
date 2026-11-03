import React from "react";

export type IconName =
    | 'check'
    | 'close'
    | 'user'
    | 'team'
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
    | 'link'
    | 'unlink'
    | 'play'
    | 'pause'
    | 'stop'
    | 'step-forward'
    | 'skip-forward'
    | 'mouse'
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
    | 'bindings'
    | 'refresh'
    | 'connector'
    | 'flash'
    | 'http-request'
    | 'aggregator'
    | 'lock'
    | 'help'
    | 'report-analytics'
    | 'docs'
    | 'comment'
    | 'undo'
    | 'redo'
    | 'if'
    | 'loop'
    | 'circle'
    | 'git'
    | 'globe'
    | 'portal'
    | 'drag-handle'
    | 'minus'
    | 'chevron-up'
    | 'fit-view'
    | 'flask'
    | 'warning'
    | 'error-circle'
    | 'check-circle'
    | 'clock'
    | 'code'
    | 'cloud'
    | 'package'
    | 'external-link'
    | 'send'
    | 'image'
    | 'sparkles'
    | 'plug-off'
    | 'arrow-right'
    | 'microphone'

export type IconColor =
    | 'default'
    | 'primary'
    | 'secondary'
    | 'danger'
    | 'inherit';

/**
 * The Beebot voice assistant's states: microphone off, waiting for the wake word, hearing speech, working on a
 * request, and travelling to something it points at (wings only).
 */
export type BeebotState = 'off' | 'idle' | 'active' | 'thinking' | 'flying';

type IconBaseProps = {
    size?: number;
    color?: IconColor;
    className?: string;
    onClick?: () => void,
    isSubtle?: boolean,
};

/** `beebot` is the one stateful icon: it brings its own colours (`color` is ignored) and needs its state. */
export type IconProps = IconBaseProps & (
    | { name: IconName; state?: never }
    | { name: 'beebot'; state: BeebotState }
);

export type IconComponent = React.FC<IconProps>;
